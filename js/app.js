const containerPosters=document.querySelector("#containerPosters");
const checkVideo = document.querySelectorAll("input[name='typeVideo']");
const currentCheckVideo = document.querySelector("input[name='typeVideo']:checked");
const inputSearch = document.querySelector("nav input[type='search']");
const modal = document.querySelector('#Modal');
const buttonSavePoster = modal.querySelector(".modal-footer button.add");
const messageContainer = document.querySelector('div#message');
const linkShowPedidos=document.querySelector("nav a.pedidos");
let postersJSON={};
let pedidos=JSON.parse(localStorage.getItem("pedidos"))||[];
console.log(pedidos);

const buttonsModal=(namePoster,index)=>{
    if(pedidos.some(el=>el.product.name==namePoster)){
        return `
                <button class="btn btn-success" disabled>Comprado</button>
                <button data-delete="${index}" class="btn btn-danger">Eliminar</button>
        `;
    }else{
        return `<button data-buy="${index}" class="btn btn-primary">Comprar</button>`;
    }
}

const showPedidos=()=>{
    pedidos.forEach(el=>{
        containerPosters.innerHTML+=`
        <div class="card p-0 mx-4 my-2" style="width: 18rem;" data-id="${el.id}">
            <img src="img/${el.product.img}" class="card-img-top" alt="...">
            <div class="card-body">
                <h5 class="card-title fw-bold text-center">${el.product.name}</h5>
                <p class="card-text"><b>Duracion:</b> ${el.product.duration}</p>
                <p class="card-text"><b>Director/a:</b> ${el.product.director.toString()}</p>
                <p class="card-text"><b>Genero:</b> ${el.product.gender.toString()}</p>
                <p class="card-text"><b>Precio:</b> ${el.price}€</p>
                <p class="card-text"><b>Unidades:</b> ${el.cantidad}</p>
                <p class="card-text"><b>Tamaño:</b> ${el.size}</p>
            </div>
        </div>
    `;  
    })
}

const printPosters=(type,search)=>{
    containerPosters.innerHTML="";
    if(type=="pedidos"){
        showPedidos();
    }else{
        let types=(type=="videos")?["films","series"]:[type];
        for(let type of types){
            postersJSON[type].forEach((el,index) =>{
                if(!search || String(el.name).toUpperCase().includes(search.toUpperCase())){
                    containerPosters.innerHTML+=`
                        <div class="card p-0 mx-4 my-2" style="width: 18rem;" data-id="${index}" data-type="${el.type}">
                            <img src="img/${el.img}" class="card-img-top" alt="...">
                            <div class="card-body">
                                <h5 class="card-title fw-bold text-center">${el.name}</h5>
                                <p class="card-text"><b>Duracion:</b> ${el.duration}</p>
                                <p class="card-text"><b>Director/a:</b> ${el.director.toString()}</p>
                                <p class="card-text"><b>Genero:</b> ${el.gender.toString()}</p>
                                <div class="text-center">${buttonsModal(el.name,index)}</div>
                            </div>
                        </div>
                    `;                
                }

            });        
        }        
    }

}

const getJSON=async()=>{
    let res = await fetch("../data/video.json");
    postersJSON=(await res.json()).video;
    checkVideo.forEach(radio=>{
        radio.addEventListener("click",(e)=>printPosters(e.target.value));
    });
}

const changeModal=(id,type)=>{
    let poster = postersJSON[type].find((el,index)=>index==id);
    modal.querySelector(".modal-body > p").textContent=poster.name;
    modal.querySelector("#precio").value=`${poster.price}€`;
    modal.querySelector("#precio").dataset.price=`${poster.price}€`;
    modal.querySelector(".modal-footer button.add").dataset.type=type;
    modal.querySelector(".modal-footer button.add").dataset.id=id;
}

const showModal=(DOM)=>{
    let Modal = new bootstrap.Modal(modal, {
        keyboard: false
    });
    let mainDOM = DOM.parentNode.parentNode.parentNode;
    changeModal(DOM.dataset.buy,mainDOM.dataset.type);
    Modal.show();
}

const message=(text=String,type=Boolean)=>{
    let body = messageContainer.querySelector(".modal-body");
    body.textContent=text;
    if(type){
        body.classList.toggle("alert-success");
    }else{
        body.classList.toggle("alert-danger");
    }
    let messageModal = new bootstrap.Modal(messageContainer, {
        keyboard: false
    });
    messageModal.show();
    setTimeout(()=>{
        body.classList.remove("alert-danger");
        body.classList.remove("alert-success");
        body.textContent="";
        messageModal.hide();
    },2000);
}

const savePoster=(e)=>{
    let dom = e.target;
    let domFather = dom.parentNode.parentNode;
    let json = postersJSON[dom.dataset.type].find((el,index)=>index==dom.dataset.id);
    let size = domFather.querySelector("form input[name='sizePoster']:checked").value;
    let cantidad = parseInt(domFather.querySelector("form #cantidad").value) || 1;
    let precio = parseInt(domFather.querySelector("form #precio").value.replace("€",""));
    if(size.length==0 || cantidad.length==0 || precio.length==0){
        message("Hay campos vacios",false);
        return false;
    }
    let order = {
        id:dom.dataset.id,
        product:json,
        size:size,
        cantidad:cantidad,
        price:cantidad*precio
    }
    let repeat = pedidos.some(el=>el.product.name==order.product.name)
    if (repeat==false){
        pedidos.push(order);
        localStorage.setItem("pedidos",JSON.stringify(pedidos));
        message("Poster añadido a la cesta",true);
        let poster = document.querySelector(`#containerPosters div[data-id='${dom.dataset.id}'][data-type='${dom.dataset.type}'] div.text-center`)
        poster.innerHTML=`
            <button class="btn btn-success" disabled>Comprado</button>
            <button data-delete="${dom.dataset.id}" class="btn btn-danger">Eliminar</button>
        `;
    }else{
        message("El poster ya esta en la cesta",false);
    }

}

const deletePoster=(DOM)=>{
    let name = DOM.parentNode.parentNode.querySelector(".card-title").textContent;
    console.log(name);
    pedidos=pedidos.filter(el=>el.product.name!=name);
    console.log(pedidos);
    localStorage.setItem("pedidos",JSON.stringify(pedidos));
    message("Poster eliminado de la cesta",true);
    DOM.parentNode.innerHTML=`<button data-buy="${DOM.dataset.delete}" class="btn btn-primary">Comprar</button>`;
}

const eventsPoster=(e)=>{
    let DOM = e.target;
    if (DOM.dataset.buy){
        showModal(DOM);
    }else if (DOM.dataset.delete){
        deletePoster(DOM);
    }
}

const init=async()=>{
    await getJSON();
    (currentCheckVideo)?printPosters(currentCheckVideo.value):printPosters("videos");
    inputSearch.addEventListener("keyup",(e)=>printPosters("videos",e.target.value));
    containerPosters.addEventListener("click",eventsPoster);
    buttonSavePoster.addEventListener("click",savePoster);
    linkShowPedidos.addEventListener("click",()=>printPosters("pedidos"));
}
init();