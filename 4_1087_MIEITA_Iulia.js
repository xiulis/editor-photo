
"use strict"

//TODO: REFACTORING WITH ENCAPSULATION (too many global things)
const c = document.getElementById("editable");
const space = document.getElementsByClassName("editor-zone")[0];
let myImage=null;
let selectionMode=false; //daca sunt in mod selectie sau nu // strict pentru vizualizarea selectiei pe canvas

///incarcarea imaginii in canva
space.addEventListener('dragover', (e)=>{
	space.style.display="none";
	c.style.display="flex";
	c.style.borderRadius="1px";
})

document.addEventListener('dragover', function(e){e.preventDefault();})
document.addEventListener("drop", function(e) {
    e.preventDefault();
	var files = e.dataTransfer.files;
	const reader = new FileReader();
	reader.addEventListener('load', function (e) {
		const img = document.createElement('img') 
		img.addEventListener('load', function(){
			var width = img.naturalWidth;
			var height = img.naturalHeight;
		
            const context = c.getContext('2d');
			
			c.width=width;
			c.height=height;
			
            context.drawImage(img, 0, 0, width, height);
			myImage=img;

			//set view mode value 
			console.log("load;");
			const select = document.getElementById("view-mode");
			select.value="scrollable"; 
			
			//set selection to the whole canvas
			rectangle.startX=0;
			rectangle.startY=0;
			rectangle.endX=myImage.width;
			rectangle.endY=myImage.height;
			rectangle.status="active";
			rectangle.context=context;			
		})
		img.setAttribute('src', e.target.result);
	})
	reader.readAsDataURL(files[0]);

})

//icon de save
const save = document.getElementById("save");
save.onclick = function(){
	if(myImage!=null){
		if(select.value!="scrollable") {
			//ma asigur ca salvez la calitatea cea mai buna.
			select.value="scrollable";
			changeView();
		}
		const a = document.createElement('a'); //a = anchor
		a.href=c.toDataURL('image/png',1);
		a.download='image.png';
		a.click();
	} else {
		alert("No image to download.")
	}
}


//my selection
const rectangle = {
	startX: null,
	startY: null,
	endX:null,
	endY:null,
	context:null,
	status:null	
}

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

	if(e.type==="mouseup"){
		selectionMode=false;
		rectangle.endX=e.offsetX;
		rectangle.endY=e.offsetY;
		drawSelection(e);	
	}
	if(e.type==="mousedown"){
			rectangle.context=null;
			c.style.cursor="crosshair"
			rectangle.startY=e.offsetY;
			rectangle.startX=e.offsetX;
			selectionMode=true;
	}
	//tratez si acest event pentru ca vreau sa desenez continuu forma selectiei
	if(e.type==="mousemove"&&selectionMode){
			rectangle.endX=e.offsetX;
			rectangle.endY=e.offsetY;
			drawSelection(e);
	}
}

function drawSelection(e){
	if(rectangle.context!=null) {	
		if(selectionMode){
			rectangle.context.strokeStyle="green";
			
		} else {
			rectangle.context.strokeStyle="white";
			rectangle.status="active"; ////se poate sterge daca exista un context valid (press d)	
		}
		rectangle.context.drawImage(myImage, 0, 0, myImage.naturalWidth, myImage.naturalHeight, 0,0, c.width, c.height);
		//rectangle.context.save(); //TODO: POSIBLE ERROR
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
crop.addEventListener("click", () => {
	if(myImage!=null) {
		if(rectangle.context==null){
			//nu s-a facut nicio selectia sau a fost stearsa selectia 
			alert("Select a zone before cropping!") 
		} else {
			//proportii pentru crop (in mod 100% nu au effect, dar la fit image ajusteaza selectia)
			let ratioH = myImage.naturalHeight/c.height; 
			let ratioW = myImage.naturalWidth/c.width;

			//dimensiunea este data de diferetele start-end in modul
			c.width=Math.abs(rectangle.endX-rectangle.startX);
			c.height=Math.abs(rectangle.endY-rectangle.startY);

			//calculez punctul de start deoarece user-ul ar putea sa selecteze diferit de cum m-as astepta.
			let startX = Math.min(rectangle.startX, rectangle.endX);
			let startY = Math.min(rectangle.startY, rectangle.endY);
			
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
	} else {
		alert("Please upload a picture first.")
	}
})



//icon resize
const resize= document.getElementById("resize");
resize.onclick=function(){
	if(myImage!=null){
		const f = document.getElementById("form-size");
		f.style.display="block";
		f.style.position="absolute";
		dragElement(f);

		const h = document.getElementById("height");
		const w = document.getElementById("width");

		let height = c.height;
		let width = c.width;
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
	} else {
		alert("Please upload a picture first.")
	}
}

//icon text 
//TODO: try to do it smarter, please. it's too basic.
const text= document.getElementById("addText");
text.onclick= function(e) {
	if(myImage!=null){
		///form de text;
		rectangle.context=null;
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

				//afisez al doilea form
				const position=document.getElementById("form-position");
				position.style.display="block";
				position.style.position="absolute";
				
				dragElement(position);

				//iau controalele de tip input pentru pozitii
				const x= document.getElementById("x");
				const y=document.getElementById("y");
				
				//le setez valoarea
				x.value=c.width/2;
				y.value=c.height/2;

				x.onchange=moveText;
				y.onchange=moveText;

				function moveText(){
					//redesenez pentru fiecare modificare, super dezamagita de eficienta implementarii
					ctx.drawImage(myImage, 0,0,myImage.width, myImage.height, 0,0, c.width, c.height);
					ctx.fillText(inputText.value, x.value, y.value);
				}

				document.getElementById("btn-confirm").onclick = function() {
					position.style.display="none";		
					myImage.src=c.toDataURL();
				}
			}
			else{
				alert("All fields must be completed.")
			}
		})		
	}

	else {
		alert("Upload image first");
	}

	
}


//TODO: BUG LA IMAGINI SUPER MICI INCARCATE, SE MARESTE IMAGINEA.
// It's not a bug, it's a feature. :)
const select = document.getElementById("view-mode");
select.onchange=changeView;
function changeView() {
	if(myImage!=null) {
		if(select.value==="scrollable"){
			c.width=myImage.naturalWidth;
			c.height=myImage.naturalHeight;

			const ctx = c.getContext("2d");
			ctx.drawImage(myImage, 0,0, c.width, c.height);
			rectangle.context=null;
		}
		if(select.value==="fit") {
			
			//fortez pentru estetica aplicatiei dimensionarea pe inaltime
			c.width=Math.round(myImage.width*(500/myImage.height));
			c.height=500;

			const ctx = c.getContext("2d");
			ctx.drawImage(myImage, 0,0, myImage.naturalWidth,myImage.naturalHeight,0,0, c.width, c.height);
			//TODO: bug redraws badly
			rectangle.context=null;
		}
	}
	else {
		alert("Upload an image first!");
		select.value="scrollable";
	}
}


//icon effect
const effect=document.getElementById("addEffect");
effect.addEventListener("click", function() {
	if(myImage!=null) {
		const menu=document.getElementById("menu-effects");
		if(menu.style.display==="none"){
			menu.style.display="flex";
		} else {
			menu.style.display="none"
		}

		const grey = document.getElementById("gray");
		const bright = document.getElementById("bright");
		const dark = document.getElementById("dark");
		const sharp = document.getElementById("sharpen");
		const sobel = document.getElementById("sobel");
		const undo =document.getElementById("undo");

		grey.onclick= greyEffect;
		bright.onclick= brightEffect;
		dark.onclick= brightEffect;
		sobel.onclick= sobelEffect;
		sharp.onclick= sharpeningEffect;

		undo.onclick = function() {
			menu.style.display="none"
			//rectangle.context.restore();
		}
	} else {
		alert('Upload an image first.');
	}
})

//TODO: Refactoring. Foloseste asta si la crop. Cod duplicat.
//De fapt mai destept ar fi sa faci tu corectia oricum in rectangle.
function calculatePoints(){
	let startX =  Math.min(rectangle.startX, rectangle.endX);
	let startY = Math.min(rectangle.startY, rectangle.endY);

	let widthX = Math.abs(rectangle.startX-rectangle.endX);
	let widthY = Math.abs(rectangle.startY-rectangle.endY);

	return {startX, startY, widthX, widthY};
}

function greyEffect() {
	if(rectangle.context!=null){
		let selection= calculatePoints();
		rectangle.context.drawImage(myImage,0,0, myImage.width, myImage.height,0,0, c.width, c.height);
		const pixels = rectangle.context.getImageData(selection.startX,selection.startY, selection.widthX, selection.widthY);
		for(let i=0; i<pixels.data.length; i+=4)
		{
			let r = pixels.data[i];
			let g= pixels.data[i+1];
			let b=  pixels.data[i+2];
			let corectie = (r + g + b)/3;
			pixels.data[i] = pixels.data[i+1] =pixels.data[i+2]= corectie;
		}
		rectangle.context.data=pixels.data;
		rectangle.context.putImageData(pixels,selection.startX,selection.startY,0,0,selection.widthX, selection.widthY);
		rectangle.context.save();
		myImage.src=c.toDataURL();
	}
}

function checkRGB(data) {
	if(data>255){
		data=255;
	} else {
		if(data<0){
			data=0
		}
	}
	return data;
}

function brightEffect(e) {
	if(rectangle.context!=null){
		let selection= calculatePoints();
		rectangle.context.drawImage(myImage,0,0, myImage.width, myImage.height,0,0, c.width, c.height);
		//TODO: CHECK IF WIDTHS DIFFERENT OF 0, if not crapa getImageData.
		const pixels = rectangle.context.getImageData(selection.startX,selection.startY, selection.widthX, selection.widthY);
		let value=-10;
		if(e.srcElement.id==="bright") {
			value=10; }
		for(let i=0; i<pixels.data.length; i+=4){
			pixels.data[i] += value; 
			pixels.data[i+1]+= value;
			pixels.data[i+2]+= value;
			
			pixels.data[i]=checkRGB(pixels.data[i]);
			pixels.data[i+1]=checkRGB(pixels.data[i+1]);
			pixels.data[i+2]=checkRGB(pixels.data[i+2]);
		}
		rectangle.context.data=pixels.data;
		rectangle.context.putImageData(pixels,selection.startX,selection.startY,0,0,selection.widthX, selection.widthY);
		myImage.src=c.toDataURL();
	}
}

function sharpeningEffect(){
	if(rectangle.context!=null){
		rectangle.context.drawImage(myImage,0,0, myImage.width, myImage.height,0,0, c.width, c.height);
		//const pixels = ctx.getImageData(0,0,c.width, c.height); //whole image
		let selection = calculatePoints();
		const pixels = rectangle.context.getImageData(selection.startX,selection.startY, selection.widthX, selection.widthY);
		let effect = convolute(pixels, [0, -1, 0, -1, 5, -1, 0, -1, 0], false);
		

		let image = rectangle.context.createImageData(effect.width, effect.height);
		for(let i=0;i<image.data.length;i+=4){
			//let value=  Math.abs(effect.data[i])
			image.data[i]+=Math.abs(effect.data[i]);
			image.data[i+1] += Math.abs(effect.data[i+1]);
			image.data[i+2]+= Math.abs(effect.data[i+2]);
			image.data[i+3]+= 255;
		}

		rectangle.context.putImageData(image,selection.startX,selection.startY);
		myImage.src = c.toDataURL();
	}
}


function convolute(image, array, opaque){
	var side = Math.round(Math.sqrt(array.length));
	var halfside = Math.floor(side/2);

	const src= image.data;
	const sw = image.width;
	const sh = image.height;

	const w = sw;
	const h = sh;

	var output = {
		width: w, height:h, data: new Float32Array(w*h*4)
	};

	const pixels = output.data;

	for(let y=0;y<h;y++){
		for(let x=0;x<w;x++){
			let sy=y;
			let sx=x;
			const inter = (y*w+x)*4;
			let r=0, g=0, b=0, a=0;
			for(let cy=0;cy<side;cy++){
				for(let cx=0;cx<side;cx++){

					let scy = sy+cy -halfside;
					let scx = sx+cx - halfside;

					let srcOff = (scy *sw +scx)*4;

					const wt = array[cy*side+cx];

					r+= src[srcOff] * wt;
					g+= src[srcOff+1] * wt;
					b+= src[srcOff+2] * wt;
					a+= src[srcOff+3] * wt;
				}
			}
			
			pixels[inter] =r;
			pixels[inter+1] =g;
			pixels[inter+2] =b;
			pixels[inter+3] =a;
		}
	}

	return output;
}



//convolution filter, we have to mix 
//TODO: Selection shape gets in the way... after applying the effect on a zone, then on the whole image..
function sobelEffect(){
	rectangle.context.drawImage(myImage,0,0, myImage.width, myImage.height,0,0, c.width, c.height);
	//greyEffect();
	//const pixels = ctx.getImageData(0,0,c.width, c.height); //whole image
	let selection = calculatePoints();
	const pixels = rectangle.context.getImageData(selection.startX,selection.startY, selection.widthX, selection.widthY);
	let vertical = convolute(pixels, [-1, 0, 1, -2, 0, 2, -1, 0, 1], false);
	let horizontal = convolute(pixels, [-1, -2, -1, 0, 0, 0, 1, 2, 1], false);
	//create Imagedata ?

	let image = rectangle.context.createImageData(vertical.width, vertical.height);
	for(let i=0;i<image.data.length;i+=4){
		let v=  Math.abs(vertical.data[i])
		image.data[i]=v;
		let h = Math.abs(horizontal.data[i]);

		image.data[i+1] = h;
		image.data[i+2]= (v+h)/4;
		image.data[i+3]= 255;
	}

	rectangle.context.putImageData(image,selection.startX,selection.startY);
	myImage.src = c.toDataURL();
	
}


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


