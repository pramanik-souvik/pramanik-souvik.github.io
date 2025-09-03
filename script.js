/* ========== Typing Animation ========== */
const roles = ["AI Researcher", "Developer", "AI & Data Science Enthusiast"];
let i = 0, j = 0, currentRole = '', isDeleting = false;
const typingSpan = document.querySelector('.typing-text span');

function typeRole() {
  const fullRole = roles[i];
  if(isDeleting){
    currentRole = fullRole.substring(0, currentRole.length - 1);
  } else {
    currentRole = fullRole.substring(0, currentRole.length + 1);
  }
  typingSpan.textContent = currentRole;
  let speed = isDeleting ? 100 : 200;
  if(!isDeleting && currentRole === fullRole){
    isDeleting = true;
    speed = 1500;
  } else if(isDeleting && currentRole === ''){
    isDeleting = false;
    i++;
    speed = 500;
    if(i >= roles.length) i = 0;
  }
  setTimeout(typeRole, speed);
}
typeRole();

/* ========== Smooth Scroll + Active Menu ========== */
const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll("header nav a");

window.addEventListener("scroll", () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 80;
    if(scrollY >= sectionTop) current = section.getAttribute("id");
  });
  navLinks.forEach(link => {
    link.classList.remove("active");
    if(link.getAttribute("href") === `#${current}`){
      link.classList.add("active");
    }
  });
});

/* ========== Dark/Light Mode Toggle ========== */
const toggle = document.getElementById('theme-toggle');
toggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  toggle.innerHTML = document.body.classList.contains('light-mode') 
    ? '<i class="fas fa-sun"></i>' 
    : '<i class="fas fa-moon"></i>';
});

/* ========== Dynamic Content ========== */
fetch("content.json")
  .then(res => res.json())
  .then(data => {
    const skillsContainer = document.getElementById("skills-container");
    data.skills.forEach(skill => {
      const div = document.createElement("div");
      div.className = "skill";
      div.textContent = skill;
      skillsContainer.appendChild(div);
    });

    const projectsContainer = document.getElementById("projects-container");
    data.projects.forEach(p => {
      const div = document.createElement("div");
      div.className = "project";
      div.innerHTML = `<h3>${p.title}</h3><p>${p.desc}</p>
        <div class="proj-links">
          ${p.github ? `<a href="${p.github}" target="_blank"><i class="fab fa-github"></i></a>` : ''}
          ${p.live ? `<a href="${p.live}" target="_blank"><i class="fas fa-external-link-alt"></i></a>` : ''}
        </div>`;
      projectsContainer.appendChild(div);
    });

    const researchContainer = document.getElementById("research-container");
    data.research.forEach(r => {
      const div = document.createElement("div");
      div.className = "paper";
      div.innerHTML = `<h3>${r.title}</h3><p>${r.desc}</p>`;
      researchContainer.appendChild(div);
    });
  });
