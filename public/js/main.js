(function () {

	var dropZone = document.documentElement;
	var uploadButton = document.querySelector('input[type="file"]');
	var form = document.querySelector('form');
	var dropOverlay = document.querySelector('.drop');

	var p = document.querySelector('p');
	var responseHTML = document.querySelector('.response');

	var socket = io(':8000');
	var socketCookie = null;

	socket.on('connect', function (a) {

		socket.on('registration', function (data) {
			socketCookie = data;
			console.log('Регистрация клиента, io.cookie.id =', socketCookie.id);
		})

		socket.on('notification', function (data) {
			console.log(data);
			p.innerHTML = data.message;
		})
	})

	document.addEventListener("dragover", function( event ) {
		event.dataTransfer.effectAllowed = 'copy';
		event.dataTransfer.dropEffect = 'copy';
		event.preventDefault();
	}, false);

	document.addEventListener("dragenter", function( event ) {
		dropZone.classList.add('__upload');
	}, false);

	document.addEventListener("dragleave", function( event ) {
		if (event.target == uploadButton) {
			dropZone.classList.remove('__upload');
		}
	}, false);

	document.addEventListener("drop", function( event ) {
		dropZone.classList.remove('__upload');
	}, false);

	uploadButton.addEventListener('change', function (e) {
		var acceptFiles = uploadButton.getAttribute('accept').slice(1);
		var fileName = uploadButton.getAttribute('name');

		if (e.target.files.length !== 1 || e.target.files[0].type.indexOf(acceptFiles) === -1 ) {
			uploadButton.value = '';
		} else {
			var formData = new FormData();
			var xhr = new XMLHttpRequest();
			var uploadTarget = document.querySelector('form').getAttribute('action');

			formData.append('socketCookie', socketCookie.id);

			formData.append(fileName, uploadButton.files[0], uploadButton.files[0].name);

			xhr.open("POST", uploadTarget);
			xhr.onreadystatechange = function() {
				if (this.readyState != 4) return;
				responseHTML.innerHTML = this.responseText;
				form.style.display = 'none';
				document.querySelector('body').classList.remove('__loading');
			}

			xhr.send(formData);
		}
	})
})();
