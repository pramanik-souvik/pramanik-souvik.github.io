/* Typing Animation */
const roles = ["AI Researcher", "Developer", "AI & Data Science Enthusiast"];
let i=0, j=0, currentRole='', isDeleting=false;
const typingSpan=document.querySelector('.typing-text span');

function typeRole(){
  const fullRole = roles[i];
  if(isDeleting){
    currentRole = fullRole.substring(0,currentRole.length-1);
  } else {
    currentRole = fullRole.substring(0,currentRole.length+1);
  }
  typingSpan.textContent=currentRole;
  let speed = isDeleting ? 100 : 200;
  if(!isDeleting && currentRole===fullRole){
    isDeleting=true;
    speed=1500;
  } else if(isDeleting && currentRole===''){
    isDeleting=false;
    i++;
    speed=500;
    if(i>=roles.length) i=0;
  }
  setTimeout(typeRole,speed);
}
typeRole();

/* Smooth Scroll + Active Menu */
const sections=document.querySelectorAll("section");
const navLinks=document.querySelectorAll("header nav a");

window.addEventListener("scroll",()=>{
  let current='';
  sections.forEach(section=>{
    const sectionTop=section.offsetTop-100;
    if(scrollY >= sectionTop) current=section.getAttribute("id");
  });
  navLinks.forEach(link=>{
    link.classList.remove("active");
    if(link.getAttribute("href")==`#${current}`) link.classList.add("active");
  });
});

/* Dark/Light Mode Toggle */
const toggle=document.getElementById('theme-toggle');
toggle.addEventListener('click',()=>{
  document.body.classList.toggle('light-mode');
  toggle.innerHTML=document.body.classList.contains('light-mode') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

/* Dynamic Content */
fetch("content.json")
.then(res=>res.json())
.then(data=>{
  const skillsContainer=document.getElementById("skills-container");
  data.skills.forEach(skill=>{
    const div=document.createElement("div");
    div.className="skill";
    div.innerHTML=`<h4>${skill.name}</h4>
      <div class="skill-bar"><div class="skill-bar-fill" style="width:${skill.level}"></div></div>`;
    skillsContainer.appendChild(div);
  });

  const projectsContainer=document.getElementById("projects-container");
  data.projects.forEach(p=>{
    const div=document.createElement("div");
    div.className="project";
    div.innerHTML=`<h3>${p.title}</h3><p>${p.desc}</p>
      <div class="proj-links">
        ${p.github ? `<a href="${p.github}" target="_blank"><i class="fab fa-github"></i></a>` : ''}
        ${p.live ? `<a href="${p.live}" target="_blank"><i class="fas fa-external-link-alt"></i></a>` : ''}
      </div>`;
    projectsContainer.appendChild(div);
  });

  const researchContainer=document.getElementById("research-container");
  data.research.forEach(r=>{
    const div=document.createElement("div");
    div.className="paper";
    div.innerHTML=`<h3>${r.title}</h3><p>${r.desc}</p>`;
    researchContainer.appendChild(div);
  });

  // Animate skill bars
  const skillFills=document.querySelectorAll('.skill-bar-fill');
  skillFills.forEach(fill=>{
    setTimeout(()=>{fill.style.width=fill.style.width;},200);
  });
});

/* Particles.js Init */
particlesJS("particles-js", {
  "particles": {
    "number": { "value": 80 },
    "color": { "value": ["#00FF00","#1E90FF"] },
    "shape": { "type": "circle" },
    "opacity": { "value": 0.5 },
    "size": { "value": 3 },
    "line_linked": { "enable": true, "distance": 120, "color": "#00FF00", "opacity": 0.4, "width": 1 },
    "move": { "enable": true, "speed": 2 }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" } }
  }
});
