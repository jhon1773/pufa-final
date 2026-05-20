(function () {
  const path = window.location.pathname;

  const roleByPrefix = [
    { prefix: '/tramites/', role: 'producer' },
    { prefix: '/proveedor/', role: 'provider' },
    { prefix: '/academico/', role: 'academy' },
    { prefix: '/admin/', role: 'admin' },
  ];

  const rule = roleByPrefix.find((r) => path.startsWith(r.prefix));
  if (!rule) return;

  let session = null;
  try {
    session = JSON.parse(localStorage.getItem('pufab_session') || 'null');
  } catch {
    session = null;
  }

  const loggedIn = Boolean(session?.loggedIn && session?.role);
  const allowed = loggedIn && session.role === rule.role;

  if (!allowed) {
    const redirect = encodeURIComponent(path + window.location.search + window.location.hash);
    window.location.href = `/iniciar-sesion/?redirect=${redirect}`;
  }
})();
