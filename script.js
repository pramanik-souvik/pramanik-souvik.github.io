// Typing animation for roles
const roles = ["AI Researcher", "Developer", "AI & Data Science Enthusiast"];
let i = 0, j = 0, currentRole = '', isDeleting = false;
const typingSpan = document.querySelector('.typing-text span');

function typeRole() {
  if(i >= roles.length) i = 0;
  const fullRole = roles[i];
  
  if(isDeleting) {
    currentRole = fullRole.substring(0, currentRole.length - 1);
  } else {
    currentRole = fullRole.substring(0, currentRole.length + 1);
  }

  typingSpan.textContent = currentRole;

  if(!isDeleting && currentRole === fullRole) {
    isDeleting = true;
    setTimeout(typeRole, 1500);
  } else if(isDeleting && currentRole === '') {
    isDeleting = false;
    i++;
    setTimeout(typeRole, 500);
  } else {
    setTimeout(typeRole, isDeleting ? 100 : 200);
  }
}
typeRole();

// Load dynamic content from JSON
fetch("content.json")
  .then(res => res.json())
  .then(data => {
    // Skills
    const skillsContainer = document.getElementById("skills-container");
    data.skills.forEach(skill => {
      const div = document.createElement("div");
      div.className = "skill";
      div.textContent = skill;
      skillsContainer.appendChild(div);
    });

    // Projects
    const projectsContainer = document.getElementById("projects-container");
    data.projects.forEach(p => {
      const div = document.createElement("div");
      div.className = "project";
      div.innerHTML = `<h3>${p.title}</h3><p>${p.desc}</p>`;
      projectsContainer.appendChild(div);
    });

    // Research
    const researchContainer = document.getElementById("research-container");
    data.research.forEach(r => {
      const div = document.createElement("div");
      div.className = "paper";
      div.innerHTML = `<h3>${r.title}</h3><p>${r.desc}</p>`;
      researchContainer.appendChild(div);
    });
  });
