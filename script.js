const navbar = document.getElementById("navbar");
const navbarToggle = navbar.querySelector(".navbar-toggle");

function openMobileNavbar() {
  navbar.classList.add("opened");
  navbarToggle.setAttribute("aria-label", "Close navigation menu.");
}

function closeMobileNavbar() {
  navbar.classList.remove("opened");
  navbarToggle.setAttribute("aria-label", "Open navigation menu.");
}

navbarToggle.addEventListener("click", () => {
  if (navbar.classList.contains("opened")) {
    closeMobileNavbar();
  } else {
    openMobileNavbar();
  }
});



const navbarMenu = navbar.querySelector(".navbar-menu");
const navbarLinksContainer = navbar.querySelector(".navbar-links");

navbarLinksContainer.addEventListener("click", (clickEvent) => {
  clickEvent.stopPropagation();
});

navbarMenu.addEventListener("click", closeMobileNavbar);


// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyCFafYwQn-TPleaeXpMCIKHfl8l6xMY_ac",
    authDomain: "test-form-8ca72.firebaseapp.com",
    projectId: "test-form-8ca72",
    storageBucket: "test-form-8ca72.appspot.com",
    messagingSenderId: "436094478193",
    appId: "1:436094478193:web:6ffc8e36f3f2121966b8d0"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);


/// Mobile
//const menu = document.querySelector('#mobile-menu')[0];
//const menuLinks = document.querySelector('.navbar__menu')[0];
//const navLogo = document.querySelector('#navbar__logo');
/*
const navbar = document.getElementById("navbar");
const navbarToggle = navbar.querySelector(".navbar-toggle");

function openMobileNavbar() {
  navbar.classList.add("opened");
  navbarToggle.setAttribute("aria-label", "Close navigation menu.");
}

function closeMobileNavbar() {
  navbar.classList.remove("opened");
  navbarToggle.setAttribute("aria-label", "Open navigation menu.");
}

navbarToggle.addEventListener("click", () => {
  if (navbar.classList.contains("opened")) {
    closeMobileNavbar();
  } else {
    openMobileNavbar();
  }
});



const navbarMenu = navbar.querySelector(".navbar-menu");
const navbarLinksContainer = navbar.querySelector(".navbar-links");

navbarLinksContainer.addEventListener("click", (clickEvent) => {
  clickEvent.stopPropagation();
});

navbarMenu.addEventListener("click", closeMobileNavbar);
nyufyufuyuijj
*/

// Display mobile menu


/*
menu.addEventListener('click', () =>
{
    menuLinks.classList.toggle('active');
});
*/
/*
const mobileMenu = () => 
{
    
    menu.classList.toggle('is-active');
    menuLinks.classList.toggle('active');
    body.classList.toggle('active');
    //added
};

menu.addEventListener('click', mobileMenu);
*/
//Modal Items
const modal = document.getElementById('email-modal');
const openBtn = document.querySelector('.main__btn');
const closeBtn = document.querySelector('.close-btn');

// Click Events
openBtn.addEventListener('click', () => 
{
    modal.style.display = 'block';
});

closeBtn.addEventListener('click', () =>
{
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => 
{
    if(e.target === modal)
    {
        modal.style.display = 'none';
    }
})

// SQL Injection
const form = document.getElementById('form');
const name = document.getElementById('name');
const email = document.getElementById('email');
const subject = document.getElementById('subject');


let nameCheck = false;
let SubjectCheck = false;
let email_IsValid = false;

// Show error msg
function showError(input, incorrect)
{
    const formInfo = input.parentElement;
    formInfo.className = 'form-info error';

    const errorMessage = formInfo.querySelector('p');
    errorMessage.innerText = incorrect;
}

// showValid Input
function showValid(input)
{
    const formInfo = input.parentElement;
    formInfo.className = 'form-info valid';

}


// Get fieldName
function getFieldName(input)
{
    return input.name.charAt(0).toUpperCase() + input.name.slice(1);
}

// Check Required Fields
function checkRequired(inputArr)
{
    //isGoodForm = false;
    inputArr.forEach(function(input) 
    {
        if(input.value.trim() === '')
        {
        showError(input, `${getFieldName(input)} is required`);
        //isGoodForm = false;

        }
            else 
            {
                showValid(input);
               
            }    
    })
}

// Check Input Length
function checkLength(input,min, max)
{

    nameCheck = false;
    if(input.value.length < min)
    {
        showError(input,`${getFieldName(input)} must be at least ${min} characters`);
        nameCheck = false;

    }
    else if (input.value.length > max)
    {
        showError(input, `${getFieldName(input)} must be less than ${max} characters`);
        nameCheck = false;
    }
    else 
    { 
        nameCheck = true;

        showValid(input);

    }
}



function checkSubLength(inputt,minn, maxx)
{

    SubjectCheck = false;

    if(inputt.value.length < minn)
    {
        showError(inputt,`${getFieldName(inputt)} must be at least ${minn} characters`);
        SubjectCheck = false;

    }
    else if (inputt.value.length > maxx)
    {
        showError(inputt, `${getFieldName(inputt)} must be less than ${maxx} characters`);
        SubjectCheck = false;

    }
   
    else
    {
        showValid(inputt);
        SubjectCheck = true;
    }
}


function ValidateEmail(mail) 
{
    email_IsValid = false;
 if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(form.email.value))
  {
    email_IsValid = true;

    showValid(mail);
    return (true)
    //cho = true;
  }
    alert("You have entered an invalid email address!")
    return (false)
}



    form.addEventListener('submit', (e) =>
{
    e.preventDefault();
    checkRequired([name, email, subject]);
    checkLength(name, 3, 30);
    ValidateEmail(email);
    checkSubLength(subject, 8, 25);   
    

    if(nameCheck == true && SubjectCheck == true && email_IsValid == true)
        {

            submitForm();
        }
});

// +++++++++ ANIMATIONS ++++++++++  //
gsap.registerPlugin(ScrollTrigger);

gsap.from('.animate-section',
{
    scrollTrigger: 'animate-section',
    duration: 0.5,
    opacity: 1,
    x: -150,
    stagger: 0.12
});

gsap.from('.animate-img',
{
    scrollTrigger: 'animate-section',
    duration: 1.2,
    opacity: 0,
    x: -200,
});


// +++++++++++++++++++++++ Reference contactInfo collections +++++++++++++++++++++ //
let contactInfo = firebase.database().ref("infos");
// +++++++++++++++++++++++ SMTP +++++++++++++++++++++ //

function submitForm()
{
   
    //Get Input Values 
    const form = document.getElementById('form').value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    


    //console.log(name, email, subject, message);

    
    
    saveContactInfo(name, email, subject, message);


   document.querySelector(".modal-form").reset();
    
    sendEmail(name, email, subject, message);
    
}



//Save Info To Firebase

function saveContactInfo(name, email, subject, message)
{
    let newContactInfo =contactInfo.push();

    newContactInfo.set({
        name: name,
        email: email,
        subject: subject,
        message: message,
    });
}


function  sendEmail(name, email, subject, message)
{

    Email.send({
        Host: "smtp.gmail.com",
        Username: 'Ageritech@gmail.com',
        Password: "rkoscfxxqvsyshwn",
        To: 'Ageritech.gmail@com',
        From: 'Ageritech@gmail.com',
        Subject: `${name} sent you a message... Subject: ${subject}`,
        Body: `Name 📛 : ${name} <br/> Email 📧 : ${email} <br/> Subject ❕: ${subject} <br/> Message 🛩️ : ${message}`,
    }).then((message) => alert("Email Successfully Sent!"));
}



