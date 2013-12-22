window.storage = {};

$(function(){
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
			var str = '<li id="id-'+ i +'" data-index="'+ val.index +'" data-bold="'+ val.bold +'" data-state="'+ val.state +'" class=" '+ val.state +' '+ val.bold +' '+ val.checked +'"><div class="item">';
			str += '<a href="#expand" class="tree '+ val.state +'"></a>';
			str += '<span class="input"><input type="checkbox" '+ (val.checked?"checked":"") +' title="Отметить как выполненное"></span>';
			str += '<span class="name">'+ val.name +'</span>';
			str += '<span class="desc '+ (val.description?"":" hide") +'"><textarea readonly class="desc-inner">'+ val.description +'</textarea></span>';
			str += '</div></li>';

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
			stop:function(event, ui){
				reCalcIndex(ui.item.parent());
				DOMtoJSON();
				saveJSON();
			}
		});

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
		});

		window.storage.list = result;
	}
	function reCalcIndex(item){
		item.find('>li').each(function(){
			var index = $(this).index();
			$(this).attr('data-index', index);
		});
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
				li.addClass('checked');
			} else {
				li.removeClass('checked');
			}

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
			
			$('#edit').attr('data-id', id).each(function(){
				$(this).find('.tx:first').val(name);
				$(this).find('textarea').val(description);
				$(this).show();
			});
		}
	});
	
	//edit item
	$('#edit .cancel-button').on('click', function(e){
		e.preventDefault();
		$('#edit').hide().removeAttr('data-id').find(':text,textarea').val('');
	});
	$('#edit .edit-button').on('click', function(e){
		e.preventDefault();
		var id = $('#edit').attr('data-id');
		var name = $('#edit .tx:first').val();
		var description = $('#edit textarea').val();
		
		var item = $('#id-'+id +' >.item');
		item.find('.name').text(name);
		item.find('textarea').val(description);
		if(description.length > 3){
			item.find('.desc').removeClass('hide');
		}
		
		DOMtoJSON();
		saveJSON();
		
		$('#edit .cancel-button').click();
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
		$('#add').each(function(){
			var $this = $(this);
			$this.find(':text').val('');
			$this.show();
			$this.find('.add-button').unbind('click').click(function(e){
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
				
				storage.list[id] = result;
				storage.params.increment+=1;
		
				$this.hide();

				JSONtoDOM();
				saveJSON();
			});
			
			$this.find('.cancel-button').unbind('click').click(function(e){
				e.preventDefault();
				$this.hide();
			});
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
});
