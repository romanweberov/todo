window.storage = {};

$(function(){
	/* john resig */
	(function(){
	  var cache = {};
	  this.tmpl = function tmpl(str, data){
	    var fn = !/\W/.test(str) ?
	      cache[str] = cache[str] || tmpl(document.getElementById(str).innerHTML) :
	      new Function("obj",
	        "var p=[],print=function(){p.push.apply(p,arguments);};" +
	        "with(obj){p.push('" +
	        str
	          .replace(/[\r\t\n]/g, " ")
	          .split("<%").join("\t")
	          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
	          .replace(/\t=(.*?)%>/g, "',$1,'")
	          .split("\t").join("');")
	          .split("%>").join("p.push('")
	          .split("\r").join("\\'")
	      + "');}return p.join('');");
	    return data ? fn( data ) : fn;
	  };
	})();

	function saveJSON(){
		localStorage['storage'] = JSON.stringify(window.storage);

		$.ajax({
			type: "POST",
			url: "todo.php",
			data: {json:JSON.stringify(window.storage)}
		}).complete(function() {
			syncdone();
		});
	}
	function loadJSON(){
		window.storage = JSON.parse(localStorage['storage']);
	}
	function JSONtoDOM(){
		$('.main').hide().empty();
		$.each(window.storage.list, function(i, val){
			var str = '<li id="id-'+ i +'" data-index="'+ val.index +'" data-bold="'+ val.bold +'" data-state="'+ val.state +'" data-closed="'+ val.closed +'" class=" '+ val.state +' '+ val.bold +' '+ val.checked +' '+ val.process +'"><div class="item">';
			str += '<a href="#expand" class="tree '+ val.state +'"></a>';
			str += '<span class="input"><input type="checkbox" '+ (val.checked?"checked":"") +' title="Отметить как выполненное"></span>';
			str += '<span class="name">'+ val.name +'</span>';
			str += '<span class="desc '+ (val.description?"":" hide") +'"><textarea readonly class="desc-inner">'+ val.description +'</textarea>';
			if(val.files && val.files.length){
				str += '<span class="files cf">';
				$.each(val.files, function(i, value){
					var ext = getExt(value);
					str += '<a target="_blank" href="upload/'+ value +'" title="'+ value +'" class="file"><span>.'+ ext +'</span></a>';
				});
				str += '</span>';
			}
			str += '</span></div></li>';

			if($('#id-'+ val.parent +'-inner').size()==0){
				$('<ul id="id-'+ val.parent +'-inner"></ul>').appendTo('#id-'+ val.parent);
				$('#id-'+ val.parent).addClass('has-children');
			}

			$(str).appendTo('#id-'+ val.parent +'-inner');
		});

		$('#id-0 ul').each(function(){
			var parent = $(this), lis = parent.find('>li'), size = lis.size();
			for(var i=0;i<size;i++){
				lis.filter('[data-index='+ i +']').appendTo(parent);
			}
		});

		$('.main').show();

		$('.main ul').sortable({
			placeholder: "ui-state-highlight",
			handle: ".name",
			axis:'y',
			stop:function(event, ui){
				reCalcIndex(ui.item.parent());
				DOMtoJSON();
				saveJSON();
			}
		});

		var userAgent = navigator.userAgent.toLowerCase();
		if(userAgent.match(/firefox/)) {
			$('li').bind( "sortstart", function (event, ui) {
				ui.helper.css('margin-top', $(window).scrollTop());
			}).bind( "sortbeforestop", function (event, ui) {
				ui.helper.css('margin-top', 4);
			});
		}
		
		DOMtoCLOSED();

		events();
	}
	function DOMtoJSON(){
		var result = {};

		$('#id-0 li').each(function(){
			var li = $(this), id = Number(li.attr('id').replace('id-',''));

			result[id]={};
			result[id].name = li.find('>.item > .name').text();
			result[id].state = li.attr('data-state');
			result[id].parent = Number(li.parent().attr('id').replace('id-','').replace('-inner',''));
			result[id].index = Number(li.attr('data-index'));
			result[id].bold = li.attr('data-bold');
			result[id].checked = li.find('>.item input').is(':checked') ? 'checked' : '';
			result[id].description = li.find('>.item .desc-inner').val();
			result[id].closed = Number(li.attr('data-closed'));
			result[id].process = li.is('.process') ? 'process' : '';
			if(li.find('>.item .files a.file').size()>0){
				result[id].files = [];
				li.find('>.item .files a.file').each(function(){
					result[id].files.push($(this).attr('title'));
				});
			}
		});

		window.storage.list = result;
	}
	function reCalcIndex(item){
		item.find('>li').each(function(){
			var index = $(this).index();
			$(this).attr('data-index', index);
		});
	}
	function getExt(fname){
		return fname.substr((~-fname.lastIndexOf(".") >>> 0) + 2);
	}
	function syncdone(){
		var link = $('a.e-sync');
		if(link.find('span').size()==0){
			link.append('<span></span>');
		}
		var dt = new Date();
		var dts = dt.getDate()+'-'+Number(dt.getMonth()+1)+'-'+dt.getFullYear()+' : '+ (dt.getHours()<10?"0":"") + dt.getHours() +'-'+ (dt.getMinutes()<10?"0":"") + dt.getMinutes() +'-'+ (dt.getSeconds()<10?"0":"") + dt.getSeconds();
		link.find('span').text('[посл. '+ dts +']');
	}
	function DOMtoCLOSED(){
		var closed = [];
		$('.main li').each(function(){
			var dc = Number($(this).attr('data-closed'));
			if(dc>0){
				var name = $(this).find('>.item .name').text();
				closed.push([dc, name]);
			}
		});
		closed.sort().reverse();
		
		var str = '', currentDate = '';
		$.each(closed, function(i, val){
			var dt = new Date();
			dt.setTime(val[0]);
			var formatted = dt.getFullYear() +'-'+ Number(dt.getMonth()+1) + '-' + dt.getDate();
			if((i==0 && currentDate == '') || currentDate != formatted){
				str += '<div class="dt">'+ formatted +'</div>';
			}
			currentDate = formatted;
			str += '<div class="itm">'+ val[1] +'</div>';
		});
		
		$('#closed').empty().append(str);
	}
	function events(){
		$('li').off('contextmenu').on('contextmenu', function(e){
			e.stopImmediatePropagation();
			e.preventDefault();
			$('#context').hide();
			var position = $(this).offset();
			var id = Number($(this).attr('id').replace('id-',''));
		
			$(this).addClass('selected');

			$('#context').attr('data-id', id).css({top: e.pageY-5 +'px', left: e.pageX-5 +'px'}).show();
		});
		
		// tree expand-collapse
		$('a.tree').off('click').on('click', function(e){
			e.preventDefault();
			var parent = $(this).closest('li');
			if(parent.attr('data-state') == 'expanded'){
				parent.attr('data-state', 'collapsed').addClass('collapsed').removeClass('expanded');
			} else {
				parent.attr('data-state', 'expanded').addClass('expanded').removeClass('collapsed');
			}

			DOMtoJSON();
			saveJSON();
		});
		
		$('input:checkbox').unbind('change').change(function(){
			var li = $(this).closest('li');
			var id = Number(li.attr('id').replace('id-',''));
			if($(this).is(':checked')){
				li.addClass('checked').removeClass('process');
				li.attr('data-bold', 'normal').removeClass('bold');
				var dt = new Date();
				li.attr('data-closed', dt.getTime());
				if(li.parent().find('>.checked').size()>1){
					li.insertBefore(li.parent().find('>.checked:eq(1)'));
				} else {
					li.appendTo(li.parent());
				}
				reCalcIndex(li.parent());
			} else {
				li.removeClass('checked');
				li.attr('data-closed', 0);
				li.insertBefore(li.parent().find('>.checked:first'));
			}
			
			DOMtoCLOSED();
			DOMtoJSON();
			saveJSON();
		});
		
		$('.desc').unbind('click').click(function(e){
			$(this).addClass('visible');
		}).mouseleave(function(){
			$(this).removeClass('visible');
		});
	}

	//context buttons
	$('#context').mouseleave(function(){
		$(this).removeAttr('data-id').hide();
		$('li.selected').removeClass('selected');
	});
	$('#context .e-bld').on('click', function(e){
		e.preventDefault();
		if($('#context').attr('data-id').length>0){
			var li = $('#id-'+ $('#context').attr('data-id'));
			if(li.attr('data-bold') == 'bold'){
				li.attr('data-bold', 'normal').removeClass('bold');
			} else {
				li.attr('data-bold', 'bold').addClass('bold');
			}
			
			$('#context').mouseleave();

			DOMtoJSON();
			saveJSON();
		}
	});
	$('#context .e-pcs').on('click', function(e){
		e.preventDefault();
		if($('#context').attr('data-id').length>0){
			var li = $('#id-'+ $('#context').attr('data-id'));
			if(!li.hasClass('process')){
				li.addClass('process');
			} else {
				li.removeClass('process');
			}

			$('#context').mouseleave();

			DOMtoJSON();
			saveJSON();
		}
	});
	$('#context .e-del').on('click', function(e){
		e.preventDefault();
		if($('#context').attr('data-id').length>0){
			var li = $('#id-'+ $('#context').attr('data-id'));
			
			if(confirm("Уверены?")){
				var parent = li.parent();
				li.remove();
				if(parent.find('>li').size()==0){
					parent.remove();
				} else {
					reCalcIndex(parent);
				}

				DOMtoJSON();
				saveJSON();
			}

			$('#context').mouseleave();
		}
	});
	$('#context .e-add').on('click', function(e){
		e.preventDefault();
		if($('#context').attr('data-id').length>0){
			var id = $('#context').attr('data-id');
			addItem(id, $('#id-'+ id +'-inner > li').size());
			$('#context').mouseleave();
		}
	});
	$('#context .e-edt').on('click', function(e){
		e.preventDefault();
		if($('#context').attr('data-id').length>0){
			var id = $('#context').attr('data-id'),
			item = $('#id-'+ id +' >.item');
			
			var name = item.find('.name').text();
			var description = item.find('.desc textarea').val();

			$(tmpl("itemOptions", {name:name, description:description, action:"Сохранить"})).appendTo('body')
			.each(function(){
				var $this = $(this).find('.popup');
				$this.attr('data-id', id).show();
				$this.find('.uploadbar').each(function(){
					var ub = $(this);
					item.find('.files a.file').each(function(){
						var name = $(this).attr('title');
						var ext = getExt(name);
						$('<a target="_blank" href="upload/'+ name +'" class="file '+ ext +'" title="'+ name +'"><i></i><span>.'+ ext +'</span></a>').appendTo(ub);
					});
				});

				$this.find('.action .button:first').on('click', function(e){
					e.preventDefault();
					var id = $this.attr('data-id');
					var name = $this.find('.tx:first').val();
					var description = $this.find('textarea').val();
		
					var item = $('#id-'+id +' >.item');
					item.find('.name').text(name);
					item.find('textarea').val(description);
					if(description.length > 3){
						item.find('.desc').removeClass('hide');
					}

					item.find('.files').empty();
					$this.find('.uploadbar .file').each(function(i){
						if(i==0){
							if(item.find('.files').size()==0){
								item.find('.desc').append('<span class="files"></span>');
							}
						}
						$(this).clone().appendTo(item.find('.files'));
					});

					DOMtoJSON();
					saveJSON();
					
					$this.find('.cancel-button').click();
				});
				
				dropboxInit();

			});
		}
	});

	$(document).on("click","a.file i", function(e){
		e.preventDefault();
	    var name = $(this).parent().attr('title');
		$(this).parent().fadeOut('slow', function(){
			$(this).remove();
		});
	}).on('click', '.popup .cancel-button', function(e){
		e.preventDefault();
		$(this).closest('.popup-wrap').remove();
	});

	// expand-all, collapse-all
	$('a.e-expand-all').on('click', function(e){
		e.preventDefault();
		$('li.collapsed > .item > .tree').click();
	});
	$('a.e-collapse-all').on('click', function(e){
		e.preventDefault();
		$('li.expanded > .item > .tree').click();
	});
	$('a.e-sync').on('click', function(e){
		e.preventDefault();
		saveJSON();
	});

	// add item
	function addItem(parentID, indexNumber){
		$(tmpl("itemOptions", {name:"", description:"", action:"Добавить"})).appendTo('body')
		.each(function(){
			var $this = $(this).find('.popup');
			$this.show()
			.find('.action .button:first').click(function(e){
				e.preventDefault();
				var result = {}, id = storage.params.increment;

				result={};
				result.name = $this.find('input.tx').val();
				result.description = $this.find('textarea').val();
				result.state = 'expanded';
				result.parent = parentID;
				result.index = indexNumber;
				result.bold = '';
				result.checked = '';
				result.files = [];
				$this.find('.file').each(function(){
					var name = $(this).attr('title');
					result.files.push(name);
				});

				storage.list[id] = result;
				storage.params.increment+=1;

				JSONtoDOM();
				
				$('#id-'+id).each(function(){
					if($(this).prev().is('.checked')){
						while($(this).prev().is('.checked')){
							$(this).insertBefore($(this).prev());
						}
						reCalcIndex($(this).parent());
						DOMtoJSON();
					}
				});
				
				saveJSON();

				$this.find('.cancel-button').click();
			});

			dropboxInit();
		});
	}

	$('a.e-add-root').on('click', function(e){
		e.preventDefault();
		addItem(0, $('#id-0-inner > li').size());
	});

	// init
	if(localStorage['storage']){
		loadJSON();
		JSONtoDOM();
	} else {
		$.ajax({
			type: "POST",
			url: "todo.php",
			data: {e:"get"},
			dataType :'json'
		}).complete(function(data){
			var result = JSON.parse(data.responseText);
			if(result instanceof Object && result.list instanceof Object){
				storage = result;
				saveJSON();
				JSONtoDOM();
				syncdone();
			} else {
				storage.params = {};
				storage.list = {};
				storage.params.increment = 1;
				saveJSON();
			}
		});
	}

	function dropboxInit(){
		var dropbox = document.getElementById("dropbox");

		dropbox.addEventListener("dragenter", dragEnter, false);
		dropbox.addEventListener("dragexit", dragExit, false);
		dropbox.addEventListener("dragover", dragOver, false);
		dropbox.addEventListener("drop", drop, false);

		function dragEnter(e){
			e.stopPropagation();
			e.preventDefault();
			$(e.target).addClass('over');
		}
		function dragExit(e){
			e.stopPropagation();
			e.preventDefault();
			$(e.target).removeClass('over');
		}
		function dragOver(e){
			e.stopPropagation();
			e.preventDefault();
		}
		function drop(e){
			e.stopPropagation();
			e.preventDefault();

			var files = e.dataTransfer.files;
			var count = files.length;

			if(count > 0){
				handleFiles(files);
			}
		}
		function handleFiles(files){
			$.each(files, function(i, val){
				var file = files[i];

				var form = new FormData();
				form.append("thefile", file);

				function random(min, max) {
				  return parseInt(Math.random() * (max - min) + min);
				}
				var ext = getExt(file.name);
			
				var number = random(1, 99999);
				$('<a id="f'+ number +'" target="_blank" href="upload/'+ file.name +'" class="loading file '+ ext +'" title="'+ file.name +'"><i></i><span>.'+ ext +'</span><ins>'+ Number(file.size/1000000).toFixed(2) +'m</ins></a>').appendTo('#dropbox');

				xhr = new XMLHttpRequest();
				xhr.upload.addEventListener("progress", function(e){
					if(e.lengthComputable){
						var perc = (e.loaded / e.total) * 100 + "%";
						//console.log(perc);
					}
				}, false);
				xhr.addEventListener("load", function(){
					$('#f'+ number).removeClass('loading');
				}, false);
				xhr.open("POST", "upload.php", true);
				xhr.send(form);
			});
		}
	}

});

