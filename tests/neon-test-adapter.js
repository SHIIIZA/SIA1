import { neonConfig } from '@neondatabase/serverless';
// Keep production routes intact while directing Neon queries to disposable PostgreSQL.
export function useTestDatabase(db) {
    neonConfig.fetchFunction = async (_url, options) => {
        const request = JSON.parse(options.body);
        const run = async ({query, params}) => {
            const result = await db.query(query, params);
            return { fields: result.fields, rows: result.rows.map(row => result.fields.map(field => {
                const value = row[field.name];
                if (value == null) return null;
                if (value instanceof Date) return field.dataTypeID === 1082 ? value.toISOString().slice(0,10) : value.toISOString().replace('T', ' ').replace('Z', '+00');
                if (typeof value === 'object') return JSON.stringify(value);
                return String(value);
            })), rowCount: result.affectedRows ?? result.rows.length, command: query.trim().split(/\s+/)[0] };
        };
        try { return new Response(JSON.stringify(await run(request)), {status:200}); }
        catch(error) { return new Response(JSON.stringify({message:error.message, code:error.code}), {status:400}); }
    };
}
