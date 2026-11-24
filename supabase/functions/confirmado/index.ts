// Supabase sirve texto plano en sus dominios; basta para confirmar al usuario.
Deno.serve(
  () =>
    new Response('Cuenta confirmada. Ya puede iniciar sesión en la app.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    }),
);
