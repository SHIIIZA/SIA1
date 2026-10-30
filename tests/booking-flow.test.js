import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createBookingService, validateDates, manilaToday } from '../bookings.js';
// Run with TRIPMATE_PGLITE_PATH pointing to an installed @electric-sql/pglite module.
const runtime = process.env.TRIPMATE_PGLITE_PATH || '@electric-sql/pglite';
const { PGlite } = await import(runtime);
let db, service;
const future = (days) => new Date(Date.parse(manilaToday()) + days * 86400000).toISOString().slice(0,10);
const guest = {id: 1, role: 'guest'}, admin = {id: 2, role: 'admin'}, host = {id: 3, role: 'host'};
const body = (days, overrides = {}) => ({listing_id: 1, guest_count: 2, check_in: future(days), check_out: future(days+2), terms_accepted: true, cancellation_policy: {free_cancel_days:7,late_fee_nights:1}, total_amount: 2425, ...overrides});
const create = (days, overrides) => service.create(body(days, overrides), guest.id);
const paid = async (booking) => {
    const p = (await db.query("INSERT INTO payments(booking_id,payment_method,amount,status) VALUES ($1,'qrph',$2,'pending') RETURNING id", [booking.id, booking.total_amount])).rows[0];
    await service.verifyPayment(p.id);
    return p;
};
const rows = async (sql, args=[]) => (await db.query(sql,args)).rows;
before(async () => {
    db = new PGlite();
    await db.exec(await readFile(new URL('../schema.sql', import.meta.url), 'utf8'));
    service = createBookingService({query: async (...args) => (await db.query(...args)).rows});
    await service.initialize();
    await db.exec("INSERT INTO users (name,email,password_hash,role) VALUES ('Guest','guest@test.local','test','guest'),('Admin','admin@test.local','test','admin'),('Host','host@test.local','test','host'),('Other','other@test.local','test','guest'); INSERT INTO listings(host_id,title,property_type,location,price_per_night,max_guests,status) VALUES (3,'Test stay','House','Test',1000,4,'published');");
});
after(async () => db?.close());
test('validates impossible dates, past dates, and reversed stays', () => {
    for (const pair of [['2027-02-30','2027-03-03'],['2020-01-01','2020-01-02'],[future(5),future(4)]]) assert.throws(()=>validateDates(...pair));
});
test('rejects overlapping stays, permits adjacent checkout/check-in dates', async () => {
    const first = await create(20);
    await assert.rejects(create(21), {status:409});
    await create(22);
    assert.equal((await service.availability(1,future(21),future(22))).available,false);
    assert.equal((await service.availability(1,future(24),future(25))).available,true);
    assert.ok(first.id);
});
test('payment confirmation is idempotent and sends one confirmation per recipient', async () => {
    const b = await create(30); const p=await paid(b);
    await service.verifyPayment(p.id);
    assert.equal((await rows("SELECT * FROM notifications WHERE booking_id=$1 AND title='Booking confirmed'",[b.id])).length,3);
});
test('paid cancellation stays reserved until admin approval, refunds once, and notifies guest', async () => {
    const b=await create(40); await paid(b);
    const quote=await service.quote(b.id,guest); assert.equal(quote.refund_amount,2425);
    assert.equal((await service.cancel(b.id,guest,'request',2425)).status,'cancellation_requested');
    await assert.rejects(create(40),{status:409});
    await assert.rejects(service.cancel(b.id,{id:4,role:'guest'},'approve',2425),{status:403});
    await service.cancel(b.id,admin,'approve',2425);
    await service.cancel(b.id,admin,'approve',2425);
    assert.equal((await rows('SELECT amount FROM wallet_transactions WHERE booking_id=$1',[b.id]))[0].amount,'2425.00');
    assert.equal((await rows("SELECT * FROM notifications WHERE booking_id=$1 AND title='Refund credited'",[b.id])).length,1);
    await create(40);
});
test('late cancellation keeps a night; policy edits do not alter an existing booking', async () => {
    const b=await create(2); await paid(b);
    await service.savePolicy({free_cancel_days:30,late_fee_nights:2});
    assert.equal((await service.quote(b.id,guest)).refund_amount,1425);
    await service.cancel(b.id,guest,'request',1425);
    await service.cancel(b.id,admin,'approve',1425);
    assert.equal((await rows('SELECT amount FROM wallet_transactions WHERE booking_id=$1',[b.id]))[0].amount,'1425.00');
    const newer=await create(5,{cancellation_policy:{free_cancel_days:30,late_fee_nights:2}});
    assert.equal(newer.free_cancel_days,30); assert.equal(newer.late_fee_nights,2);
    await service.savePolicy({free_cancel_days:7,late_fee_nights:1});
});
test('unpaid cancellation refunds nothing; a delayed payment uses the frozen fee and does not resurrect the booking', async () => {
    const b=await create(0);
    await service.cancel(b.id,guest,'request',0);
    assert.equal((await rows('SELECT * FROM wallet_transactions WHERE booking_id=$1',[b.id])).length,0);
    await paid(b);
    assert.equal((await rows('SELECT status FROM bookings WHERE id=$1',[b.id]))[0].status,'cancelled');
    assert.equal((await rows('SELECT amount FROM wallet_transactions WHERE booking_id=$1',[b.id]))[0].amount,'1425.00');
});
test('host cancellation issues a full refund, even inside late window', async () => {
    const b=await create(2); await paid(b);
    await service.cancel(b.id,host,'cancel',2425);
    assert.equal((await rows('SELECT amount FROM wallet_transactions WHERE booking_id=$1',[b.id]))[0].amount,'2425.00');
});
test('rejecting a cancellation retains the booking and sends a rejection notification', async () => {
    const b=await create(50); await paid(b);
    await service.cancel(b.id,guest,'request',2425);
    assert.equal((await service.cancel(b.id,admin,'reject')).status,'confirmed');
    assert.equal((await rows('SELECT * FROM wallet_transactions WHERE booking_id=$1',[b.id])).length,0);
    assert.equal((await rows("SELECT * FROM notifications WHERE booking_id=$1 AND title='Cancellation request declined'",[b.id])).length,3);
});
test('rejects stale refund previews, unauthorized reads, premature completion, and client price tampering', async () => {
    const b=await create(60); await paid(b);
    await assert.rejects(service.cancel(b.id,guest,'request',1),{status:409});
    await assert.rejects(service.quote(b.id,{id:4,role:'guest'}),{status:404});
    await assert.rejects(service.updateStatus(b.id,'completed'),{status:409});
    await assert.rejects(create(70,{total_amount:1}),{status:409});
    await assert.rejects(create(70,{terms_accepted:false}),{status:400});
    await assert.rejects(create(70,{guest_count:10}),{status:400});
});

test('notification preferences are honored without hiding admin cancellation work', async () => {
    await db.query("INSERT INTO notifications(user_id,title,message,notification_type,is_read) VALUES (1,'Preferences',$1,'preferences',true)", [JSON.stringify({booking:false,payment:false})]);
    const b=await create(80); await paid(b);
    assert.equal((await rows('SELECT * FROM notifications WHERE user_id=1 AND booking_id=$1',[b.id])).length,0);
    assert.equal((await rows('SELECT * FROM notifications WHERE user_id=2 AND booking_id=$1',[b.id])).length,2);
});
test('concurrent booking attempts leave exactly one reservation', async () => {
    const attempts=await Promise.allSettled([create(90),create(90)]);
    assert.equal(attempts.filter(item=>item.status==='fulfilled').length,1);
    assert.equal(attempts.find(item=>item.status==='rejected').reason.status,409);
});
test('migration is safe to rerun with booking history', async () => {
    const another = createBookingService({query:async (...args)=>(await db.query(...args)).rows});
    await another.initialize();
    const [count]=await rows('SELECT count(*)::int AS total FROM bookings');
    assert.ok(count.total>0);
});
test('HTTP routes enforce ownership, persist read status, protect policy, and ignore stale bulk booking data', async () => {
    const { useTestDatabase } = await import('./neon-test-adapter.js');
    const { createHmac } = await import('node:crypto');
    process.env.DATABASE_URL='postgresql://test:test@localhost/tripmate';
    process.env.JWT_SECRET='disposable-test-secret';
    useTestDatabase(db);
    const { routeApi } = await import('../server.js');
    const tokenFor = actor => {
        const payload=Buffer.from(JSON.stringify({...actor,exp:Date.now()+60000})).toString('base64url');
        return `${payload}.${createHmac('sha256',process.env.JWT_SECRET).update(payload).digest('base64url')}`;
    };
    const request = async (actor,method,path,body={}) => {
        const req={method,headers:actor?{authorization:`Bearer ${tokenFor(actor)}`}:{},on(event,cb){if(event==='data') cb(JSON.stringify(body));if(event==='end') cb();}};
        let status,data;
        const res={writeHead(code){status=code;},end(value){data=JSON.parse(value);}};
        try { await routeApi(req,res,new URL(`http://localhost${path}`)); return {status,data}; }
        catch(error){return {status:error.status||500,data:{error:error.message}};}
    };
    assert.equal((await request(null,'GET','/api/notifications')).status,401);
    const inbox=await request(guest,'GET','/api/notifications');
    assert.equal(inbox.status,200,JSON.stringify(inbox.data));
    assert.ok(inbox.data.items.length>0);
    assert.ok(Date.parse(inbox.data.items[0].created_at)>Date.parse("2026-01-01"));
    assert.ok(inbox.data.items.every(item=>item.notification_type!=='preferences'));
    const [otherNotice]=await rows('SELECT id FROM notifications WHERE user_id=2 LIMIT 1');
    await request(guest,'PATCH',`/api/notifications/${otherNotice.id}/read`);
    assert.equal((await rows('SELECT is_read FROM notifications WHERE id=$1',[otherNotice.id]))[0].is_read,false);
    await request(guest,'PATCH','/api/notifications/all/read');
    assert.equal((await request(guest,'GET','/api/notifications')).data.unread,0);
    assert.equal((await request(guest,'PATCH','/api/admin/cancellation-policy',{free_cancel_days:3,late_fee_nights:1})).status,403);
    const initial=(await rows('SELECT id,status,total_amount FROM bookings ORDER BY id'));
    const sync=await request(admin,'POST','/api/admin/sync',{listings:[{id:'1',name:'Test stay',hostId:3,price:1000,location:'Test',status:'Verified',maxGuests:4}],bookings:[]});
    assert.equal(sync.status,200,JSON.stringify(sync.data));
    assert.deepEqual(await rows('SELECT id,status,total_amount FROM bookings ORDER BY id'),initial);
});

test('server prices respect active admin promotions and reject stale policy consent', async () => {
    await service.savePromotions([{code:'SAVE20',discount:20,active:true,expiresAt:''}]);
    const b = await create(100,{promo_code:'SAVE20',total_amount:1940});
    assert.equal(b.total_amount,'1940.00');
    await service.savePromotions([{code:'SAVE20',discount:20,active:false,expiresAt:''}]);
    await assert.rejects(create(102,{promo_code:'SAVE20',total_amount:1940}),{status:400});
    await assert.rejects(create(104,{cancellation_policy:{free_cancel_days:99,late_fee_nights:1}}),{status:409});
});
