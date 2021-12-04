
//TODO: REFACTORING WITH ENCAPSULATION 
const c = document.getElementById("editable");
const space = document.getElementsByClassName("editor-zone")[0];
let myImage=null;
let selectionMode=false; //daca sunt in mod selectie sau nu.
let selection=null;

///incarcarea imaginii in canva
space.addEventListener('dragover', (e)=>{
	space.style.display="none";
	c.style.display="flex";
	c.style.borderRadius="1px";
})

document.addEventListener('dragover', function(e){e.preventDefault();})
document.addEventListener("drop", function(e) {
    e.preventDefault();
	console.log("e target"+e.target)
	var files = e.dataTransfer.files;
	const reader = new FileReader();
	console.log(files);
	reader.addEventListener('load', function (e) {
		const img = document.createElement('img') 
		console.log("image render");
		img.addEventListener('load', function(){
			console.log("functia de load")
			var width = img.naturalWidth;
			var height = img.naturalHeight;
		
            const context = c.getContext('2d');
			
			c.width=width;
			c.height=height;
			
            context.drawImage(img, 0, 0, width, height);
			selection=context;
			myImage=img;

			//set view mode value 
			const select = document.getElementById("view-mode");
			select.value="scrollable"; 		
			
		})
		img.setAttribute('src', e.target.result);
	})
	reader.readAsDataURL(files[0]);

})

//TODO: Bug in fit mode la crop ... 

//TODO: Put the canva in 100% mode before saving programatically to get the corect sizes to export 
//icon de save
const save = document.getElementById("save");
save.onclick = function(){
	const a = document.createElement('a'); //a = anchor
	a.href=c.toDataURL('image/png',1);
	a.download='image.png';
	a.click();
}


//selection mode
//select all la dublu click : TODO: select all
// c.addEventListener('dblclick', ()=> {
// 	selection = c.getContext("2d");
// 	selection.lineWidth="4";
// 	selection.setLineDash([5,5]);
// 	selection.strokeStyle="green";
// 	selection.strokeRect(0,0,c.width,c.height);
// })

//select particularizat
c.onmousedown=getDimension;
c.onmousemove=getDimension;
c.onmouseup=getDimension;
//intru in mod selectie.


document.addEventListener("keydown", function(e){
	if(rectangle.status==="active"&&e.key==="d"){
		deleteSelection();
	}
})


//my selection
const rectangle = {
	startX: null,
	startY: null,
	endX:null,
	endY:null,
	context:null,
	status:null	
}

function deleteSelection() {
	if(rectangle.context!=null){
		rectangle.context.fillStyle="white";
		rectangle.context.drawImage(myImage, 0, 0, myImage.width, myImage.height);
		rectangle.context.fillRect(rectangle.startX,rectangle.startY,rectangle.endX-rectangle.startX,rectangle.endY-rectangle.startY);
		myImage.src=c.toDataURL();
		rectangle.context=null; //selectia nu mai exista.
	}
}

function getDimension(e){

	if(e.type=="mouseup"){
		selectionMode=false;
		rectangle.endX=e.offsetX;
		rectangle.endY=e.offsetY;
		drawSelection(e);	
	}
	if(e.type=="mousedown"){
			c.style.cursor="crosshair"
			rectangle.startY=e.offsetY;
			rectangle.startX=e.offsetX;
			selectionMode=true;
	}
	//tratez si acest event pentru ca vreau sa desenez continuu forma selectiei
	if(e.type="mousemove"&&selectionMode){
			rectangle.endX=e.offsetX;
			rectangle.endY=e.offsetY;
			drawSelection(e);
	}
}

function drawSelection(e){
	console.log("drawing");
	if(rectangle.context!=null)
	{	
		if(selectionMode){
			rectangle.context.strokeStyle="green";
			
		} else {
			rectangle.context.strokeStyle="white";
			rectangle.status="active"; ////se poate sterge daca exista un context valid (press d)	
		}
		//rectangle.context.drawImage(myImage, 0, 0, myImage.width, myImage.height);
		rectangle.context.drawImage(myImage, 0, 0, myImage.naturalWidth, myImage.naturalHeight, 0,0, c.width, c.height);
		rectangle.context.strokeRect(rectangle.startX,rectangle.startY,rectangle.endX-rectangle.startX,rectangle.endY-rectangle.startY);
	
	} else { //i am getting the same context, this part works only for mouse down (primul mouse move)
		rectangle.context=c.getContext('2d');
		rectangle.context.lineWidth="1";
		rectangle.context.setLineDash([5,5]);
		rectangle.context.strokeRect(rectangle.startX,rectangle.startY,rectangle.endX-rectangle.startX,rectangle.endY-rectangle.startY);
		//rectangle.status="active"; //selection working
	}
}

//icon crop = selectie activa - crop apasat - change canva

const crop = document.getElementById("crop");
let active=false;


crop.addEventListener("click", () => {
	if(rectangle.context==null){
		//nu s-a facut nicio selectia sau a fost stearsa selectia 
		alert("Select a zone before cropping!") 
	} else {
		//proportii pentru crop (in mod 100% nu au effect, dar la fit image ajusteaza selectia)
		ratioH = myImage.naturalHeight/c.height; 
		ratioW = myImage.naturalWidth/c.width;

		//dimensiunea este data de diferetele start-end in modul
		c.width=Math.abs(rectangle.endX-rectangle.startX);
		c.height=Math.abs(rectangle.endY-rectangle.startY);

		//calculez punctul de start deoarece user-ul ar putea sa selecteze diferit de cum m-as astepta.
		startX = Math.min(rectangle.startX, rectangle.endX);
		startY = Math.min(rectangle.startY, rectangle.endY);
		
		//ajustare pentru mod fit-image (la 100% ratio=1, no problem)
		startX=Math.round(ratioW*startX);
		startY=Math.round(ratioH*startY);
		c.width=Math.round(ratioW*c.width);
		c.height=Math.round(ratioH*c.height);

		rectangle.context.drawImage(myImage, startX,startY,c.width,c.height, 0,0, c.width, c.height);
		
		myImage.height=c.height;
		myImage.width=c.width;	
		myImage.src=c.toDataURL();
	
		//invalidez selectia ca sa nu se poata face crop din nou
		rectangle.context=null; 
	}
})



//icon resize
const resize= document.getElementById("resize");

resize.onclick=function(){
	const f = document.getElementById("form-size");
	f.style.display="block";
	f.style.position="absolute";
	dragElement(f);

	const h = document.getElementById("height");
	const w = document.getElementById("width");

	height = c.height;
	width = c.width;
	h.value=height;
	w.value=width;

	document.getElementById('cancel').addEventListener('click', ()=> {
		f.style.display="none";
	})
	document.getElementById('btn-resize').addEventListener('click', (e)=> {
		
		if((h.value>=1) && (w.value>=1)) {
			f.style.display="none";
			myImage.height=h.value;
			myImage.width=w.value;
			const context =c.getContext('2d');
			c.width=myImage.width;
			c.height=myImage.height;
			context.drawImage(myImage, 0,0, c.width, c.height);
			myImage.src=c.toDataURL();
		}
		else {
			e.stopImmediatePropagation();
    		e.preventDefault();
			alert("Valoarea specificata trebuie sa fie mai mare ca 0.")
		}
	})

	//calculez valoarea latimii, la modificarea inaltimii (pastrand proportiile) // la dimensiuni atomice se deformeaza
	h.oninput=function(){
		w.value = Math.round(width*(h.value/height)); 
	}

	//calculez valoarea inaltimii, la modificarea latimii (pastrand proportiile) //la dimensiuni atomice se deformeaza
	w.oninput=function(){
		h.value=Math.round(height*(w.value/width));
	}	
}

//icon text TODO:find a way to get where someone wants to put the text

const text= document.getElementById("addText");
text.onclick= function(e) {
	if(myImage!=null){
		///form de text;
		const f = document.getElementById("form-text");
		f.style.display="block";
		f.style.position="absolute";
		dragElement(f);

		const inputText = document.getElementById("inputClient");
		const color = document.getElementById("color");
		const size = document.getElementById("size");

		inputText.value="";
		color.value="#000000";
		size.value=10;

		document.getElementById("cancelText").addEventListener("click", ()=> {
			f.style.display="none";
		})

		document.getElementById("btn-add").addEventListener("click", (e)=> {
			e.stopImmediatePropagation();
			e.preventDefault();
			if(inputText.value&&color.value&&size.value) {
				
				const ctx=c.getContext("2d");
				ctx.fillStyle=color.value;
				const dim = `${size.value}px Arial`;
				ctx.font=dim;
				
				f.style.display="none";

				ctx.fillText(inputText.value, c.width/2, c.height/2);

				const position=document.getElementById("form-position");
				position.style.display="block";
				position.style.position="absolute";
				dragElement(position);

				
				//myImage.src=c.toDataURL();
			}
			else{
				alert("All fields must be completed.")
			}
		})

		const x= document.getElementById("x");
				const y=document.getElementById("y");
				x.value=c.width/2;
				y.value=c.height/2;

				function moveText(){
					console.log("movetext");
					console.log(ctx, inputText.value, x.value, y.value)
					ctx.fillText(inputText.value, x.value, y.value);
				}
				
				x.oninput= moveText();
				y.oninput=moveText();
				
	}

	else {
		alert("Upload image first");
	}
}

//TODO: BUG LA IMAGINI SUPER MICI INCARCATE, SE MARESTE IMAGINEA.
// It's not a bug, it's a feature. :)
const select = document.getElementById("view-mode");
select.addEventListener("change", (e)=> {
	//console.log("change",e.target)
	if(myImage!=null) {
		if(select.value=="scrollable"){
			c.width=myImage.naturalWidth;
			c.height=myImage.naturalHeight;

			const ctx = c.getContext("2d");
			ctx.drawImage(myImage, 0,0, c.width, c.height);
			rectangle.context=null;
		}
		if(select.value=="fit") {
			
			//fortez pentru estetica aplicatiei dimensionarea pe inaltime
			c.width=Math.round(myImage.width*(500/myImage.height));
			c.height=500;

			const ctx = c.getContext("2d");
			ctx.drawImage(myImage, 0,0, myImage.naturalWidth,myImage.naturalHeight,0,0, c.width, c.height);
			rectangle.context=null;
		}
	}
	else {
		alert("Upload an image first!");
		select.value="scrollable";
	}
})



//////////////////////////////stole - TODO: refactoring 


function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    //e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

//const selector =document.getElementById("view_mode");

