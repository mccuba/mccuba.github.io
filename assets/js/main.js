// ---------------------------------------------------------------
// Footer year
// ---------------------------------------------------------------

document.getElementById('year').textContent =
  new Date().getFullYear();


// ---------------------------------------------------------------
// Scroll reveal
// ---------------------------------------------------------------

const revealTargets = document.querySelectorAll(
  '.about__grid, .paper-card, .project-card, .skills__group, .contact'
);

revealTargets.forEach(
  el => el.classList.add('reveal')
);


const io = new IntersectionObserver(
  entries => {

    entries.forEach(
      entry => {

        if (entry.isIntersecting) {

          entry.target.classList.add(
            'is-visible'
          );

          io.unobserve(
            entry.target
          );

        }

      }
    );

  },
  {
    threshold: 0.15
  }
);


revealTargets.forEach(
  el => io.observe(el)
);
