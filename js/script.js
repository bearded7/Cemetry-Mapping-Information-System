$(document).ready(function() {
	//

	// --- search panel
	var searchBtn = $('#search').children('.searchBtn'),
		searchPanel = searchBtn.next(),
		searchP = searchBtn.parent();
	searchBtn.click(function(e){
		e.preventDefault();
		var _t = $(this);
		if(!_t.hasClass('active')) {
			_t.addClass('active')
			//.find('span')
			//.removeClass('icon-search icon-white')
			//.addClass('icon-remove');
			searchPanel.show();
		} else {
			_t.removeClass('active')
			//.find('span')
			//.addClass('icon-search icon-white')
			//.removeClass('icon-remove');
			searchPanel.hide();
		}
	}); // searchBtn.click //
	$(document).click(function(){
		searchBtn.removeClass('active')
			//.find('span')
			//.addClass('icon-search icon-white')
			//.removeClass('icon-remove');
		searchPanel.hide(0);
	});
	searchP.click(function(event){
		event.stopPropagation();
	});
	// --- end search panel



}); //
$(window).load(function() {
	//

	

}); //