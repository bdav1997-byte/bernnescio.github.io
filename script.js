// Pequenas interações do NESCIO.
// O site funciona sem JavaScript; este ficheiro apenas melhora a experiência.

document.querySelectorAll('nav a, .back-top').forEach(link => {
  link.addEventListener('click', () => {
    document.body.classList.add('navigating');
    setTimeout(() => document.body.classList.remove('navigating'), 500);
  });
});
