
// Function for the transition of the Login/Register forms
// Switching from the login form to the register form

var x = document.getElementById("login")
var y = document.getElementById("register")
var z = document.getElementById("authentication-btn")

function register(){
    x.style.left = "-400px";
    y.style.left = "50px";
    z.style.left = "110px";
}

function login(){
    x.style.left = "50px";
    y.style.left = "450px";
    z.style.left = "0px";
}
