/**
 * ============================================================
 * ALSTREAMING
 * register.js
 * Sistema de registro de clientes MySQL
 * ============================================================
 */


const BASE_URL = "/Alex/backend/api/";

let loading = false;
let currentNotification = null;



document.addEventListener(
"DOMContentLoaded",
()=>{


const form = document.getElementById("registerForm");


if(!form) return;




const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const btn = document.getElementById("btnRegister");






form.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



if(loading) return;





const data = {


full_name:
fullName.value.trim(),


email:
email.value.trim().toLowerCase(),


phone:
phone.value.trim(),


password:
password.value,


confirm:
confirmPassword.value


};







/*
============================================================
VALIDACIONES
============================================================
*/


if(!data.full_name)
{

notify(
"Ingrese su usuario.",
"warning"
);

fullName.focus();

return;

}






if(!data.email)
{

notify(
"Ingrese su correo.",
"warning"
);

email.focus();

return;

}







if(!validarEmail(data.email))
{

notify(
"Correo electrónico inválido.",
"warning"
);

email.focus();

return;

}







if(!data.password)
{

notify(
"Ingrese una contraseña.",
"warning"
);

password.focus();

return;

}






if(data.password.length < 8)
{

notify(
"La contraseña debe tener mínimo 8 caracteres.",
"warning"
);

password.focus();

return;

}






if(data.password !== data.confirm)
{

notify(
"Las contraseñas no coinciden.",
"error"
);

confirmPassword.focus();

return;

}







loading = true;


btn.disabled = true;


btn.innerHTML =
`
<i class="fa-solid fa-spinner fa-spin"></i>
Creando cuenta...
`;







try
{


const response = await fetch(

BASE_URL + "register.php",

{


method:"POST",


headers:{


"Content-Type":"application/json"

},


body:JSON.stringify({

full_name:data.full_name,

email:data.email,

phone:data.phone,

password:data.password

})


}

);








const result = await response.json();







if(!response.ok || !result.success)
{


notify(

result.message ||
"Error creando cuenta.",

"error"

);


return;

}









notify(

"Cuenta creada correctamente.",

"success"

);





form.reset();





setTimeout(()=>{


window.location.href =
"/Alex/frontend/pages/login.html";


},1500);






}
catch(error)
{


console.error(error);


notify(

"No se pudo conectar con el servidor.",

"error"

);


}
finally
{


loading=false;


btn.disabled=false;



btn.innerHTML =
`
CREAR CUENTA
<i class="fa-solid fa-user-plus"></i>
`;



}



});


});









/*
============================================================
VALIDAR EMAIL
============================================================
*/


function validarEmail(email)
{


return /^[^\s@]+@[^\s@]+\.[^\s@]+$/

.test(email);


}









/*
============================================================
NOTIFICACIONES
============================================================
*/


function notify(message,type="info")
{


const container =
document.getElementById(
"notificationContainer"
);



if(!container)
{

alert(message);

return;

}







if(currentNotification)
{

currentNotification.remove();

}







const div =
document.createElement("div");



div.className =
`notification ${type}`;



div.textContent =
message;





container.appendChild(div);



currentNotification = div;







setTimeout(()=>{


div.classList.add("hide");



setTimeout(()=>{


div.remove();



},300);



},3500);



}