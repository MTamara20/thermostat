
//
// Глобальные переменные
//

// Контрол для мониторинга состояния
var sendingStatus; 

// Информация о списке файлов. Файлов не может быть более 100
var arrFileSName = [100]; // Имя файла в файловой системе
var arrFileLName = [100]; // Полное имя файла
var arrFileDName = [100]; // Дата изменения файла

// Информация о текущем файле 
var selFileIdx; 		// Индекс файла в массиве
var selFileName;		// Имя файла
var selFileSync; 		// Признак синхронизации
var selFilePeriods; 	// Массив периодов в файле
var selFilePeriodIdx; 	// Индекс в массиве периодов


// 
// Функции взаимодействия с контроллером через HTTP-запросы 
// 

// Получение и вывод на страницу списка файлов
function GetProgList() {
	// Находим на странице элемент для отображения списка файлов
	var divFileList = document.getElementById('FileList');
	divFileList.innerHTML = 'построение списка...';

	// Очистка массивов с информацией о файлах
	for (var j = 0; j < 100; j++) {
		arrFileSName[j] = " "; 
		arrFileLName[j] = " "; 
		arrFileDName[j] = " "; 
	}
	var iIdx = 0; 
	
	// Сброс других переменных о файлах
	selFileIdx = -1; 
	selFileName = ""; 
	selFileSync = 0; 
	selFilePeriods = []; //пустой массив
	selFilePeriodIdx = -1; 

	// Адресная строка для запроса списка файлов 
	var sUrl = window.location.origin+"/getFILE_LIST?path=%2FT";  // %2FT -> /T
	// Создаем HTTP-запрос
	var xhr = new XMLHttpRequest();
	// Расписываем функцию обработки полученных HTTP-запросом данных 
	xhr.onreadystatechange = function() {
		if (this.readyState != 4) return; // обрабатываем только сообщение успешной обработки, в остальных случаях выходим
		// Переписываем ответ в переменную 
		var sResponse = this.responseText; 
		// Разделяем текст на кусочки по символу перевода строки и складываем в массив 
		var arrFileName = sResponse.split('\n');
		// Получаем из массива имя в файловой системе, полное имя файла и время файла, разложенные по строкам
		for (var i = 0; i < arrFileName.length; i++) {
			if (arrFileName[i].indexOf(".txt") > 0) {
				arrFileSName[iIdx] = arrFileName[i]; i++; 
				arrFileLName[iIdx] = arrFileName[i]; i++; 
				arrFileDName[iIdx] = arrFileName[i]; i++; 
				iIdx++; 
			}
		}

		// Бежим по массиву файлов и готовим список для вывода на странице
		var sHtml = " "; 
		for (var k = 0; k <= iIdx; k++) {
			if (arrFileSName[k].indexOf(".txt") > 0) {
				// По порядку выводим:
				// - Дату файла
				// - имя файла
				// - ссылку для загрузки и редактирования 
				// - ссылку для удаления
				sHtml += arrFileDName[k] + " "
						+ arrFileLName[k] 
						+ " <a id=\"FileLink" + k.toString() 
						+ "\" href=\"#\" onClick='LoadFile(\"" 
						+ arrFileSName[k] + "\")'>Загрузить</a>"  
						+ "Удалить"
						+ "<BR>"; 
			}
		}
		
		// Выводим подготовленный списко на страницу или сообщаем что он пуст
		if (sHtml == " ") {
			divFileList.innerHTML = 'список пуст';
		} else {
			divFileList.innerHTML = sHtml; 
		}
	}
	// Открываем HTTP-запрос 
	xhr.open('GET', sUrl, false);
	// Отправляем HTTP-запрос 
	xhr.send();
}


// Запись настроенной программы работы в файл микроконтроллера
function SaveFile(bAddNew) {
	// Отладка, показываем начало выполнения 
	sendingStatus.innerHTML = 'SaveFile begin<BR>';	

	// Проверяем нет ли в массиве файла с таким именем
	// Получаем имя файла из поля для ввода
	var sFileFind = document.getElementById('txtProgName').value; 
	// Определяем номер файла
	var sFileNum = " "; 
	if (bAddNew == '0') {
		// Поиск файла с таким же пользовательским именем
		for (var k = 0; k < 100; k++) {
			// Проверяем что элемент массива не пустой
			if (arrFileSName[k].indexOf(".txt") > 0) {
				// Проверяем что имя файла совпадает с искомым 
				if (arrFileLName[k].indexOf(sFileFind) >= 0) {
					sFileNum = arrFileSName[k].substring(0,6); 
					break; 
				}
			} 
		}
	}
	// Отладка, показываем номер файла в файловой системе, это значение используется в имени файла
	sendingStatus.innerHTML += 'SaveFile sFileNum='+sFileNum+'<BR>';	

	// Если не нашли с таким пользовательским именем, то ищем свободное имя для сохранения
	if (sFileNum == " ") {
		// Цикл генерации номеров файлов
		for (var k = 0; k < 100; k++) {
			var sFileGen = "/T/"; 
			// Дописываем 0 если число меньше 10
			if (k < 10)	sFileGen += "0"; 
			// Дописываем номер
			sFileGen += k.toString() + "."; 
			// Проверяем в массиве наличие такого файла
			for (var m = 0; m < 100; m++) { 
				if (arrFileSName[m].indexOf(sFileGen) >= 0) { 
					sFileGen = " "; 
					break; 
				}
			}
			if (sFileGen == " ") {
				// Был найден файл с таким именем, ничего не делаем
			} else { 
				// Такого файла нет, можно использовать, выходим из цикла перебора номеров
				sFileNum = sFileGen; 
				break; 
			}
		}
		// Отладка, показываем номер файла в файловой системе, это значение используется в имени файла
		sendingStatus.innerHTML += 'SaveFile sFileNum='+sFileNum+'<BR>';	
	}

	// Если все 100 номеров файла заняты, то файл не сохраняем  
	if (sFileNum == " ") {
		sendingStatus.innerHTML += 'Уже много файлов<BR>';	
		return; 
	}

	// Получаем текущую дату и время 
	var vDateTime = new Date(); 
	// Получаем строку с номером месяца
	var nMM = vDateTime.getMonth(); 
	var sMM = nMM.toString(10); 
	if (nMM < 10) { 
		sMM = "0" + sMM; 
	}
	// Получаем строку с номером дня
	var nDD = vDateTime.getDate(); 
	var sDD = nDD.toString(10); 
	if (nDD < 10) { 
		sDD = "0" + sDD; 
	}
	// Отладка, показываем номер месяца и номер дня
	sendingStatus.innerHTML += 'SaveFile sMM='+sMM+'<BR>';	
	sendingStatus.innerHTML += 'SaveFile sDD='+sDD+'<BR>';	
	
	// Сохраняем файл с текстом и доп информацией
	// Заголовочная часть файла: имя файла для пользователя и дата изменения файла
	var sFileBody = document.getElementById('txtProgName').value + '\n' 
					+ vDateTime.getFullYear() + '-' + sMM + '-' + sDD + ' ' + vDateTime.toTimeString().substring(0,5); 
	// Признак синхронизации
	if (document.getElementById('chkProgSync').checked)  selFileSync = "1"; 
	else  selFileSync = "0"; 
	sFileBody = sFileBody + '\n' + selFileSync; 
	// Отладка, показываем Признак синхронизации
	sendingStatus.innerHTML += 'SaveFile selFileSync='+selFileSync+'<BR>';	

	// Сохраняем Массив периодов
	for (var i = 0; i < selFilePeriods.length; i++) {
		sFileBody = sFileBody + '\n' + selFilePeriods[i]; 
	}

	// Отладка, показываем содержимое файла
	//sendingStatus.innerHTML += 'SaveFile sFileBody='+sFileBody+'<BR>';	
	
	// Копируем содержимое файла в BLOB
	var aFileBody = [sFileBody]; 
	var blob2 = new Blob([aFileBody], { type: "application/octet-stream"});	
	
	// Сохраняем файл в микроконтроллере 
	// Подготавливаем URL, HTTP-запрос
	var sUrl = window.location.origin+"/FileUpload"; 
	var xhr = new XMLHttpRequest();
	// Создаем форму для отправки данных в HTTP-запросе, и помешаем в форму файл 
	var new_form = new FormData(); 
	new_form.append("filename", blob2, sFileNum + "txt");
	// Описываем действия функции после отправки файла
	xhr.onreadystatechange = function() {
		if (this.readyState != 4) return;
		blob2.close(); 
	}
	// Открываем HTTP-запрос
	xhr.open('POST', sUrl, true);
	// Отправляем в HTTP-запросе форму с файлом
	xhr.send(new_form);
	
	// Обновляем список файлов на странице
	GetProgList(); 
	// Отладка, показываем окончание выполнения 
	sendingStatus.innerHTML += 'SaveFile end<BR>';	
}


// Загрузка программы работы из файла микроконтроллера
function LoadFile(sFileName) {
	// Отладка, показываем начало загрузки
	sendingStatus.innerHTML = ' LoadFile <BR>';	
	/**/ 
	// Находим имя файла в загруженном списке файлов и получаем его индекс в массиве
	selFileIdx = -1;
	for (var k = 0; k < 100; k++) {
		if (arrFileSName[k] == sFileName) {
			document.getElementById('txtProgName').value = arrFileLName[k]; 
			selFileIdx = k;
			break; 
		} 
	}
	// Отладка, показываем индекс файла
	//sendingStatus.innerHTML += ' LoadFile selFileIdx='+selFileIdx+' <BR>'; 
	if (selFileIdx == -1) {
		sendingStatus.innerHTML = 'Не найден файл "'+sFileName+'"';	
		return; 
	}

	selFilePeriods = []; //пустой массив
	selFilePeriodIdx = -1; 
	
	/**/ 
	var sFileNameTxt = sFileName.substring(0,6) + "txt"; 
	// Подготавливаем URL
	var sUrlFile = window.location.origin + sFileNameTxt; 
	// Отладка, показываем имя файла в файловой системе
	//sendingStatus.innerHTML += ' LoadFile sUrlFile='+sUrlFile+' <BR>';	
	// 
	// Подготавливаем HTTP-запрос
	var xhrFile = new XMLHttpRequest();
	xhrFile.onreadystatechange = function() {
		if (this.readyState != 4) return;
		// Отладка, сообщаем что получен ответ
		//sendingStatus.innerHTML += ' LoadFile Response <BR>';	
		/**/
		var sResponse = this.responseText; 
		// Отладка, показываем полученный ответ
		//sendingStatus.innerHTML += ' LoadFile sResponse='+sResponse+' <BR>';	

		// Запоминаем имя файла в файловой системе
		selFileName = sFileNameTxt; 
		// Разбираем содержимое файла по строкам 
		var arrFileStr = sResponse.split('\n');
		var i = 0; 
		// Выводим пользовательское имя файла 
		document.getElementById('txtProgName').value = arrFileStr[i]; i++; 
		i++; // пропускаем строку со временем
		selFileSync = arrFileStr[i]; i++; 
		if (selFileSync == "1") {
			document.getElementById('chkProgSync').checked = true; 
		} else {
			document.getElementById('chkProgSync').checked = false; 
		}

		// Отладка, число строк в массиве и текущую позицию
		//sendingStatus.innerHTML += ' LoadFile arrFileStr.length='+arrFileStr.length+' <BR>';	
		//sendingStatus.innerHTML += ' LoadFile pos i='+i+' <BR>';	
		/**/
		// Разбираем заданные периоды
		selFilePeriodIdx = 0; 
		for (; i < arrFileStr.length; i++) {
			selFilePeriods[selFilePeriodIdx] = arrFileStr[i]; 
			selFilePeriodIdx++; 
		}
		// Отладка, индекс по периодам
		//sendingStatus.innerHTML += ' LoadFile selFilePeriodIdx='+selFilePeriodIdx+' <BR>';	
		selFilePeriodIdx = -1; 
		/**/
		// Выводим на страницу периоды
		PeriodLoad(); 
	};
	// Отладка, сообщаем об отправке
	//sendingStatus.innerHTML += ' LoadFile send <BR>';	
	// Открываем соединение и отправляем запрос 
	xhrFile.open('GET', sUrlFile, false);
	xhrFile.send(); 
	/**/
	// Отладка, сообщаем о завершении загрузки файла
	sendingStatus.innerHTML += ' LoadFile end <BR>';	
}


//
// Функции интерфейса без взаимодействия с контроллером 
//


// Показываем на странице список периодов
function PeriodLoad() {
	// Отладка, 
	//sendingStatus.innerHTML += ' PeriodLoad <BR>';	
	//sendingStatus.innerHTML += ' PeriodLoad selFilePeriods.length='+selFilePeriods.length+' <BR>';	
/**/
	// Получаем элемент для списка периодов 
	var divPeriodList = document.getElementById('PeriodList');
	// Очищаем список периодов 
	divPeriodList.innerHTML = '';

	// Подготавливаем строку со списом перидов, ссылками для редактирования и удаления
	var htmlPeriodList = ' '; 
	for (var i = 0; i < selFilePeriods.length; i++) {
		htmlPeriodList = htmlPeriodList + selFilePeriods[i] 
						+ " <a id=\"PeriodLink" + i.toString() + "\" href=\"#\" onClick='PeriodSelect(" 
						+ i.toString() + ")'>Изменить</a>"  
						+ "Удалить"
						+ '<BR>'; 
	}
	// Выводим на страницу подготовленную строку
	divPeriodList.innerHTML = htmlPeriodList;
/**/
	// Отладка, 
	//sendingStatus.innerHTML += ' PeriodLoad end <BR>';	
}


// Сохраняем в массиве настроенный период
function PeriodSave(bAddNew) {
	// Отладка, 
	sendingStatus.innerHTML = ' PeriodSave <BR>';	
/**/
	// Определяем индекс периода
	if (bAddNew == '1') {
		selFilePeriodIdx = selFilePeriods.length; 
	} else {
		if (selFilePeriodIdx < 0) 
			selFilePeriodIdx = selFilePeriods.length; 
		if (selFilePeriodIdx > selFilePeriods.length) 
			selFilePeriodIdx = selFilePeriods.length; 
	}
	
	// Вносим в массив строку описывающую период
	selFilePeriods[selFilePeriodIdx] =  document.getElementById('PeriodT1').value
								+ ';' + document.getElementById('PeriodT2').value
								+ ';' + document.getElementById('PeriodTime').value
								+ ';' + document.getElementById('PeriodCounting').checked
								+ ';' + document.getElementById('PeriodName').value; 
	
	//alert('PeriodSave 2');

	// Выводим на страницу периоды
	PeriodLoad(); 
	// Отладка, 
	sendingStatus.innerHTML += ' PeriodSave end <BR>';
/**/
}


// Выводим на страницу из массива настроенный период
function PeriodSelect(nIdx) {
	// Отладка, 
	sendingStatus.innerHTML = ' PeriodSelect <BR>';	
	
	// Если не действительный индекс - выходим т.к. нечего загружать
	if (nIdx >= selFilePeriods.length) {
		return; 
	}
	
	// Заносим элементы назделенные ; в массив
	var sP = selFilePeriods[nIdx]; 
	var arrPeriodStr = sP.split(';');
	var i = 0; 
	/**/
	// Элементы массива переносим в контролы
	document.getElementById('PeriodT1').value		= arrPeriodStr[i]; i++; 
	document.getElementById('PeriodT2').value		= arrPeriodStr[i]; i++; 
	document.getElementById('PeriodTime').value		= arrPeriodStr[i]; i++; 
	var sBool = arrPeriodStr[i]; i++; 
	if (sBool == 'true')	document.getElementById('PeriodCounting').checked = true; 
	else 					document.getElementById('PeriodCounting').checked = false; 
	document.getElementById('PeriodName').value		= arrPeriodStr[i]; i++;  
	/**/
	// Запоминаем индекс загруженного периода
	selFilePeriodIdx = nIdx;
	
	// Отладка, 
	sendingStatus.innerHTML += ' PeriodSelect end <BR>';
}


// Действия при загрузке страницы 
// <body onload="loadPage()">
function loadPage() {
	// Заполняем ссылку на поле вывода состояния передачи и прочих отладок и сообщений
	sendingStatus = document.getElementById('spanSendingStatus');
	sendingStatus.innerHTML = ' loadPage <BR>';

	// Загружаем список настроенные программ 
	GetProgList(); 
	
	// Назначаем обработчики для кнопок сохранения и добавления периода
	document.getElementById('btnPeriodAdd').onclick = function() {
		PeriodSave('1'); 
	}
	document.getElementById('btnPeriodSave').onclick = function() {
		PeriodSave('0'); 
	}

	// Назначаем обработчики для кнопок сохранения и добавления файлов 
	document.getElementById('btnProgAdd').onclick = function() {
		SaveFile('1'); 
	}
	document.getElementById('btnProgSave').onclick = function() {
		SaveFile('0'); 
	}
	
	// Отладка, 
	sendingStatus.innerHTML += ' loadPageEnd <BR>';
}

