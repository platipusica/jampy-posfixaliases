(function($, task) {
"use strict";

function Events1() { // email_aliases 

	function on_page_loaded(task) {
	
		task.init_tabs($("#content"));
		
		$("title").text(task.item_caption);
		$("#title").text(task.item_caption);
		 
		if (task.safe_mode) {
			$("#user-info").text(task.user_info.role_name + ' ' + task.user_info.user_name);
			$("#log-out")
			.show()
			.click(function(e) {
				e.preventDefault();
				task.logout();
			});
		}
	
		$("#taskmenu").show();
		task.each_item(function(group) {
			var li,
				ul;
			if (group.visible) {
				li = $('<li class="dropdown"><a class="dropdown-toggle" data-toggle="dropdown" href="#">' + 
					group.item_caption + ' <b class="caret"></b></a></li>');			
				$("#menu").append(li);
				if (group.items.length) {
					ul = $('<ul class="dropdown-menu">'); 
					li.append(ul);
					group.each_item(function(item) {
						if (item.visible && item.can_view()) {
							ul.append($('<li>')
								.append($('<a class="item-menu" href="#">' + item.item_caption + '</a>')
								.data('item', item)));					
						}
					});
				}
			}
		});
	
		$('#menu .item-menu').on('click', (function(e) {
			var item = $(this).data('item'); 
			e.preventDefault();
			if (item.item_type === "report") { 
				item.print(false);
			} 
			else { 
				item.view($("#content"));
			}
		}));
	
		$('#menu .item-menu:first').click(); 
	
		// $(document).ajaxStart(function() { $("html").addClass("wait"); });
		// $(document).ajaxStop(function() { $("html").removeClass("wait"); });
	} 
	
	function on_view_form_created(item) {
		var table_options = {
				height: 620,
				sortable: true,
				// freeze_count: 2,
				on_dblclick: function() {
					item.edit_record($("#content"));
				}
			};
	  
		if (!item.master) {
			item.paginate = true;
		}
	
		item.clear_filters();
	
		if (item.view_form.hasClass('modal')) {
			item.view_options.width = 1060;
			item.view_form.find("#form-title").hide();
		}
		else {
			table_options.height = $(window).height() - $('body').height() - 20;
		}
		if (item.can_create()) {
			item.view_form.find("#new-btn").on('click.task', function(e) { 
				e.preventDefault();
				item.insert_record($("#content"));
			});
		}
		else {
			item.view_form.find("#new-btn").prop("disabled", true);
		}
		
		item.view_form.find("#edit-btn").on('click.task', function(e) { 
			e.preventDefault();
			item.edit_record($("#content"));
		});
		
		if (item.can_delete()) {
			item.view_form.find("#delete-btn").on('click.task', function(e) { 
				e.preventDefault();
				item.delete_record(function() {
					item.refresh_page(true);
				}) 
			});
		}
		else {
			item.view_form.find("#delete-btn").prop("disabled", true);
		}
		
		create_print_btns(item);
	
		if (item.view_form.find(".view-table").length) {
			if (item.init_table) {
				item.init_table(item, table_options);
			}
			item.create_table(item.view_form.find(".view-table"), table_options);
			item.open(true);
		}
	}
	
	function on_view_form_closed(item) {
		item.close();
	}
	
	function on_edit_form_created(item) {
		var options = {
				col_count: 1
			};
			
		item.edit_options.width = 600;
		if (item.init_inputs) {
			item.init_inputs(item, options);
		}
	
		item.create_inputs(item.edit_form.find(".edit-body"), options);
			
		item.edit_form.find("#cancel-btn").on('click.task', function(e) { item.cancel_edit(e) });
		item.edit_form.find("#ok-btn").on('click.task', function() { item.apply_record() });
	}
	
	function on_edit_form_close_query(item) {
		var result = true;
		if (item.is_changing()) {
			if (item.is_modified()) {
				item.yes_no_cancel(task.language.save_changes,
					function() {
						item.apply_record();
					},
					function() {
						item.cancel_edit();
					}
				);
				result = false;
			}
			else {
				item.cancel();
			}
		}
		return result;
	}
	
	function on_filter_form_created(item) {
		item.filter_options.title = item.item_caption + ' - filter';
		item.create_filter_inputs(item.filter_form.find(".edit-body"));
		item.filter_form.find("#cancel-btn")
			.on('click.task', function() { item.close_filter_form() });
		item.filter_form.find("#ok-btn")
			.on('click.task', function() { item.apply_filters() });
	}
	
	function on_param_form_created(item) {
		item.create_param_inputs(item.param_form.find(".edit-body"));
		item.param_form.find("#cancel-btn")
			.on('click.task', function() { item.close_param_form() });
		item.param_form.find("#ok-btn")
			.on('click.task', function() { item.process_report() });
	}
	
	function on_before_print_report(report) {
		var select;
		report.extension = 'pdf';
		if (report.param_form) {
			select = report.param_form.find('select');
			if (select && select.val()) {
				report.extension = select.val();
			}
		}
	}
	
	function on_view_form_keyup(item, event) {
		if (event.keyCode === 45 && event.ctrlKey === true){
			item.insert_record();
		}
		else if (event.keyCode === 46 && event.ctrlKey === true){
			item.delete_record();
		}
	}
	
	function on_edit_form_keyup(item, event) {
		if (event.keyCode === 13 && event.ctrlKey === true){
			item.edit_form.find("#ok-btn").focus();
			item.apply_record();
		}
	}
	
	function create_print_btns(item) {
		var i,
			$ul,
			$li,
			reports = [];
		if (item.reports) {
			for (i = 0; i < item.reports.length; i++) {
				if (item.reports[i].can_view()) {
					reports.push(item.reports[i]);
				}
			}
			if (reports.length) {
				$ul = item.view_form.find("#report-btn ul");
				for (i = 0; i < reports.length; i++) {
					$li = $('<li><a href="#">' + reports[i].item_caption + '</a></li>');
					$li.find('a').data('report', reports[i]);
					$li.on('click', 'a', function(e) {
						e.preventDefault();
						$(this).data('report').print(false);
					});
					$ul.append($li);
				}
			}
			else {
				item.view_form.find("#report-btn").hide();
			}
		}
		else {
			item.view_form.find("#report-btn").hide();
		}
	}
	this.on_page_loaded = on_page_loaded;
	this.on_view_form_created = on_view_form_created;
	this.on_view_form_closed = on_view_form_closed;
	this.on_edit_form_created = on_edit_form_created;
	this.on_edit_form_close_query = on_edit_form_close_query;
	this.on_filter_form_created = on_filter_form_created;
	this.on_param_form_created = on_param_form_created;
	this.on_before_print_report = on_before_print_report;
	this.on_view_form_keyup = on_view_form_keyup;
	this.on_edit_form_keyup = on_edit_form_keyup;
	this.create_print_btns = create_print_btns;
}

task.events.events1 = new Events1();

function Events2() { // email_aliases.catalogs 

	function init_table(item, options) {
		if (!item.view_form.hasClass('modal')) {
			item.selections = [];	
		} 
	} 
	function on_view_form_created(item) {
		var timeOut,
			i,
			search,
			captions = [],
			field,
			search_field;
		if (item.default_field) {
			search_field = item.default_field.field_name;
		}
		else if (item.view_options.fields.length) {
			for (i = 0; i < item.view_options.fields.length; i++) {
				field = item.field_by_name(item.view_options.fields[i]);
				if (field && can_sort_on_field(field)) {
					search_field = item.view_options.fields[i];
					break;
				}
			}
		}
		if (!item.view_form.hasClass('modal')) {	
			item.view_form.find('#email-btn')
				.click(function() {
					if (item.task.mail.can_create()) {
						item.task.mail.open({open_empty: true}); 
						item.task.mail.append_record(); 
					}
					else { 
						item.warning('You are not allowed to send emails.');
					}
				}) 
				.show(); 
			item.view_form.find('#print-btn')
				.click(function() { 
					item.task.customers_report.customers.value = item.selections;
					item.task.customers_report.print(false);
				})
				.show();
		}
		if (search_field) {
			item.view_form.find('.header-search').show();		
			if (item.lookup_field && item.lookup_field.value && !item.lookup_field.multi_select) {
				item.view_form.find("#selected-value")
					.text(item.lookup_field.display_text)
					.click(function() {
						item.view_form.find('#search-input').val(item.lookup_field.lookup_text);					
						item.search(item.default_field.field_name, item.lookup_field.lookup_text);
					});
				item.view_form.find("#selected-div").css('display', 'inline-block');
			}
			item.view_form.find('#search-fieldname').text(
				item.field_by_name(search_field).field_caption);
			item.view_form.find('#search-field-info')
				.popover({
					container: 'body',
					placement: 'left',
					trigger: 'hover',
					title: 'Search field selection',
					content: 'To select a search field hold Ctrl key and click on the corresponding column of the table.'
				})
				.click(function(e) {
					e.preventDefault();
				});
			search = item.view_form.find("#search-input");
			search.on('input', function() {
				var input = $(this);
				input.css('font-weight', 'normal');
				clearTimeout(timeOut);
				timeOut = setTimeout(function() {
						var field = item.field_by_name(search_field),
							search_type = 'contains_all';
						if (field.lookup_type !== 'text') {
							search_type = 'eq';
						}
						item.search(search_field, input.val(), search_type, function() {
							input.css('font-weight', 'bold');
						});
					},
					500
				);
			});
			search.keydown(function(e) {
				var code = e.which;
				if (code === 13) {
					e.preventDefault();
				}
				else if (code === 40) {
					item.view_form.find('.dbtable.' + item.item_name + ' .inner-table').focus();
	//				item.view_form.find(".inner-table").focus();
					e.preventDefault();
				}
			});
			item.view_form.on('keydown', function(e) {
				var code = e.which;
				if (isCharCode(code) || code === 8) {				
					if (!search.is(":focus")) {
						if (code !== 8) {
							search.val('');
						}
						search.focus();
					}
				}
			});
			item.view_form.on('click.search', '.dbtable.' + item.item_name + ' .inner-table td', function(e) {
				var field;
				if (e.ctrlKey) {			
					if (search_field !== $(this).data('field_name')) {
						search_field = $(this).data('field_name');
						field = item.field_by_name(search_field);
						if (can_sort_on_field(field)) {
							item.view_form.find('#search-fieldname')
								.text(item.field_by_name(search_field).field_caption);
							item.view_form.find("#search-input").val('');
						}
					}
				}
			});
		}
		else {
			item.view_form.find("#search-form").hide();
		}
	}
	
	function can_sort_on_field(field) {
		if (field && field.lookup_type !== "blob" && field.lookup_type !== "currency" &&
			field.lookup_type !== "float" && field.lookup_type !== "boolean" && 
			field.lookup_type !== "date" && field.lookup_type !== "datetime") {
			return true;
		}
	}
	
	function isCharCode(code) {
		if (code >= 48 && code <= 57 || code >= 96 && code <= 105 || 
			code >= 65 && code <= 90 || code >= 186 && code <= 192 || 
			code >= 219 && code <= 222) {
			return true;
		}
	}
	this.init_table = init_table;
	this.on_view_form_created = on_view_form_created;
	this.can_sort_on_field = can_sort_on_field;
	this.isCharCode = isCharCode;
}

task.events.events2 = new Events2();

function Events3() { // email_aliases.journals 

	function on_view_form_created(item) { 
		item.view_form.find("#filter-btn").click(function() {item.create_filter_form()});	
		if (!item.on_filters_applied) {
			item.on_filters_applied = function() {
				if (item.view_form) {
					item.view_form.find("#filter-text").text(item.get_filter_text());		
				}
			};
		}
	}
	
	function on_view_form_shown(item) {
		item.view_form.find('.dbtable.' + item.item_name + ' .inner-table').focus();
	}
	this.on_view_form_created = on_view_form_created;
	this.on_view_form_shown = on_view_form_shown;
}

task.events.events3 = new Events3();

function Events6() { // email_aliases.catalogs.wasp 

	function init_inputs(item, options) {
		item.mail.data_type = task.consts.BLOB;
	}
	
	function on_field_validate(field) {
		if (field.field_name === 'mail') {
				//return 'The sum is too big.';
		}
	}
	function on_view_form_created(item) {
		item.view_form.find('#save-btn').click(function() {
		   item.server('save_to_file', [item.id.value]);
		});
	}
	this.init_inputs = init_inputs;
	this.on_field_validate = on_field_validate;
	this.on_view_form_created = on_view_form_created;
}

task.events.events6 = new Events6();

function Events7() { // email_aliases.catalogs.aliases_table_head 

	function init_inputs(item, options) {
		item.header.data_type = task.consts.BLOB;
	}
	this.init_inputs = init_inputs;
}

task.events.events7 = new Events7();

function Events13() { // email_aliases.catalogs.icrar 

	function init_inputs(item, options) {
		item.mail.data_type = task.consts.BLOB;
	}
	
	function on_field_validate(field) {
		if (field.field_name === 'mail') {
				//return 'The sum is too big.';
		}
	}
	function on_view_form_created(item) {
		item.view_form.find('#save-btn').click(function() {
		   item.server('save_to_file', [item.id.value]);
		});
	}
	this.init_inputs = init_inputs;
	this.on_field_validate = on_field_validate;
	this.on_view_form_created = on_view_form_created;
}

task.events.events13 = new Events13();

function Events17() { // email_aliases.admin.aliases_table_footer 

	function init_inputs(item, options) {
		item.footer.data_type = task.consts.BLOB;
	}
	function on_edit_form_created(item) {
		item.edit_options.width = 1100;
		item.edit_form.find('textarea.footer').height(420);
	}
	this.init_inputs = init_inputs;
	this.on_edit_form_created = on_edit_form_created;
}

task.events.events17 = new Events17();

})(jQuery, task)
