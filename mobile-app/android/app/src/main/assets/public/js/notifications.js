(() => {
    'use strict';
    if (!localStorage.getItem('tripmate_access_token') || document.getElementById('bellBtn')) return;
    const user = JSON.parse(localStorage.getItem('tripmate_user') || '{}');
    const bookingsUrl = new URL(user.role === 'host' ? '../host/dashboard.html' : '../dashboard.html', document.currentScript.src).href;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('../css/notifications.css', document.currentScript.src).href;
    document.head.append(stylesheet);
    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'tripmate-notification-launcher';
    launcher.textContent = 'Notifications';
    launcher.setAttribute('aria-haspopup', 'dialog');
    const dialog = document.createElement('dialog');
    dialog.className = 'tripmate-notifications';
    dialog.setAttribute('aria-labelledby', 'notificationHeading');
    dialog.innerHTML = '<header><h2 id="notificationHeading">Notifications</h2><button type="button" data-close aria-label="Close notifications">Close</button></header><button type="button" data-read-all>Mark all as read</button><p role="status" data-status></p><div data-items></div>';
    document.body.append(launcher, dialog);
    const status = dialog.querySelector('[data-status]');
    const list = dialog.querySelector('[data-items]');
    let loading = false;
    const refresh = async () => {
        if (loading || !localStorage.getItem('tripmate_access_token')) return;
        loading = true;
        try {
            const data = await apiRequest('/notifications');
            launcher.textContent = data.unread ? `Notifications (${data.unread})` : 'Notifications';
            status.textContent = data.items.length ? `${data.unread} unread` : 'No notifications yet.';
            list.replaceChildren();
            for (const item of data.items) {
                const article = document.createElement('article');
                article.className = item.is_read ? '' : 'is-unread';
                const title = document.createElement('h3'); title.textContent = item.title;
                const message = document.createElement('p'); message.textContent = item.message;
                const time = document.createElement('time'); time.dateTime = item.created_at; time.textContent = new Date(item.created_at).toLocaleString('en-PH');
                article.append(title, message, time);
                if (item.booking_id) {
                    const link = document.createElement('a'); link.href = bookingsUrl; link.textContent = 'View bookings'; article.append(link);
                }
                if (!item.is_read) {
                    const read = document.createElement('button'); read.type = 'button'; read.textContent = 'Mark as read';
                    read.addEventListener('click', async () => {
                        read.disabled = true;
                        try { await apiRequest(`/notifications/${item.id}/read`, { method: 'PATCH' }); await refresh(); }
                        catch (error) { status.textContent = error.message; read.disabled = false; }
                    });
                    article.append(read);
                }
                list.append(article);
            }
        } catch (error) { status.textContent = error.message || 'Unable to load notifications.'; }
        finally { loading = false; }
    };
    launcher.addEventListener('click', () => { dialog.showModal(); refresh(); });
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-read-all]').addEventListener('click', async (event) => {
        event.target.disabled = true;
        try { await apiRequest('/notifications/all/read', { method: 'PATCH' }); await refresh(); }
        catch (error) { status.textContent = error.message; }
        finally { event.target.disabled = false; }
    });
    window.tripmateRefreshNotifications = refresh;
    window.addEventListener('focus', refresh);
    window.addEventListener('tripmate-user-updated', event => {
        if (!event.detail) { launcher.remove(); dialog.close(); dialog.remove(); clearInterval(timer); }
    });
    const timer = setInterval(() => { if (!document.hidden) refresh(); }, 30000);
    refresh();
})();
