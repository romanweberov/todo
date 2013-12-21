window.storage;
$(function(){
	function saveJSON(){
		localStorage['list'] = JSON.stringify(window.storage);
	}
	function loadJSON(){
		window.storage = JSON.parse(localStorage['list']);
	}
	function JSONtoDOM(){
		$('.main').hide();
		$.each(window.storage, function(i, val){
			var str = '<li id="id-'+ i +'" data-index="'+ val.index +'" data-state="'+ val.state +'" class=" '+ val.state +'"><div class="item">';
			str += '<a href="#expand" class="tree '+ val.state +'"></a>';
			str += '<span class="input"><input type="checkbox" title="Отметить как выполненное"></span>';
			str += '<span class="name">'+ val.name +'</span>';
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
				reCalcIndex(ui.item);
				DOMtoJSON();
				saveJSON();
			}
		});
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
		});
		
		window.storage = result;
	}
	function reCalcIndex(item){
		item.parent().find('>li').each(function(){
			var index = $(this).index();
			$(this).attr('data-index', index);
		});
	}

	loadJSON();
	JSONtoDOM();

	$('a.tree').on('click', function(e){
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

	$('li').on('contextmenu', function(e){
		e.stopImmediatePropagation();
		e.preventDefault();
		$('#context').hide();
		var position = $(this).offset();
		var id = Number($(this).attr('id').replace('id-',''));
		
		$(this).addClass('selected');
		
		$('#context').attr('data-id', id).css({top: e.pageY-5 +'px', left: e.pageX-5 +'px'}).show();
	});
	$('#context').mouseleave(function(){
		$(this).removeAttr('data-id').hide();
		$('li.selected').removeClass('selected');
	});
});
