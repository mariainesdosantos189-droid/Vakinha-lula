# Viva o PT — deploy na Vercel
1. Supabase: rode `supabase.sql` no SQL Editor.
2. Vercel > Project > Settings > Environment Variables:
   AMPLOPAY_PUBLIC_KEY, AMPLOPAY_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
   PAYMENTS_ENABLED=true, PUBLIC_URL=https://seu-dominio, CAMPAIGN_TARGET=100000,
   CAMPAIGN_DEADLINE (opcional, AAAA-MM-DD), CAMPAIGN_OPEN (false para encerrar)
3. Edite CONFIG no fim do index.html (organizador, beneficiário, contato).
4. Suba a pasta na Vercel (GitHub ou CLI) e teste com um Pix pequeno.
