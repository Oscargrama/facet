const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bbcjvemhlyufhkrioaia.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiY2p2ZW1obHl1ZmhrcmlvYWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODA5NDQsImV4cCI6MjA4ODc1Njk0NH0.Zi4KqSzDEnRiVnXsLiSSX9zfCifXB7aDfTq5meLADSE');

async function sync() {
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id').limit(1);
    if (pError || !profiles || profiles.length === 0) {
        console.log('NO_PROFILE_FOUND - Waiting for user refresh');
        return;
    }
    const userId = profiles[0].id;
    const { error } = await supabase.from('rwa_lots').insert({
        originator_user_id: userId,
        lot_id: 3,
        carats: 20,
        physical_location: 'Medellín, Caja #104',
        custody_provider: 'Facet Infraestructura',
        cert_hash: '0x79abc8c508d163632ec357fcb9f2d4381d9b4c639f82d1813026c0581ac6fd41',
        metadata_cid: 'bafkreiaiwjqjrj656u7x6kzhxsozlerovzqpnshh2txntydkcbucb6ldt4',
        lot_token_supply: 2000,
        tx_hash: '0x2d49f96e586376f284a5c981a0b145b57aae2b56d11e4a3a8793aad48cf47cfb',
        registry_address: '0x4F23Be4f987F2E10C91d17410dc0E1146fCf542f'
    });
    if (error) console.log('SYNC_ERROR:', error.message);
    else console.log('SYNC_SUCCESS');
}
sync();
