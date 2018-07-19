(function($, task) {
"use strict";

function Events1() { // als 

	function on_page_loaded(task) {
		
		$("title").text(task.item_caption);
		$("#title").text(task.item_caption);
		 
		if (task.safe_mode) {
			$("#user-info").text(task.user_info.role_name + ' ' + task.user_info.user_name);
			$('#log-out')
			.show() 
			.click(function(e) {
				e.preventDefault();
				task.logout();
			}); 
		}
	
		if (task.full_width) {
			$('#container').removeClass('container').addClass('container-fluid');
		}
		$('#container').show();
	
		if (!task.safe_mode || task.user_info.role_id == 1) {	
			task.set_forms_container($("#content"));
			task.create_menu($("#menu"), {view_first: true});
		}
		else {
			$("#taskmenu").hide();
			task.email_aliases.view($("#content"));	
		}
		$("#menu-right #admin a").click(function(e) {
			var admin = [location.protocol, '//', location.host, location.pathname, 'builder.html'].join('');
			e.preventDefault();
			window.open(admin, '_blank');
		});
		$("#menu-right #about a").click(function(e) {
			e.preventDefault();
			task.message(
				task.templates.find('.about'),
				{title: 'Jam.py framework', margin: 0, text_center: true, 
					buttons: {"OK": undefined}, center_buttons: true}
			);
		});
	
		// $(document).ajaxStart(function() { $("html").addClass("wait"); });
		// $(document).ajaxStop(function() { $("html").removeClass("wait"); });
	} 
	
	function on_view_form_created(item) {
		var table_height = item.table_options.height, 
			height,
			detail,
			detail_container;
	
		item.clear_filters();
		if (!item.master) {
			item.paginate = true;	
		}
	
		if (item.view_form.hasClass('modal')) {
			item.view_options.width = 1060;
			item.view_form.find("#form-title").hide();
			table_height = $(window).height() - 300;
		}
		else {
			if (!table_height) {
				table_height = $(window).height() - $('body').height() - 20;
			}
		}
		if (item.can_create()) {
			item.view_form.find("#new-btn").on('click.task', function(e) { 
				e.preventDefault();
				if (item.master) {
					item.append_record();
				}
				else {
					item.insert_record();				
				}
			});
		}
		else {
			item.view_form.find("#new-btn").prop("disabled", true);
		}
		
		item.view_form.find("#edit-btn").on('click.task', function(e) { 
			e.preventDefault();
			item.edit_record();
		});
		
		if (item.can_delete()) {
			item.view_form.find("#delete-btn").on('click.task', function(e) { 
				e.preventDefault();
				item.delete_record(); 
			});
		}
		else {
			item.view_form.find("#delete-btn").prop("disabled", true);
		}
		
		if (!item.master && item.owner.on_view_form_created) {
			item.owner.on_view_form_created(item);
		}
	
		if (item.on_view_form_created) {
			item.on_view_form_created(item);
		}
		
		create_print_btns(item);
		
		if (item.view_form.find(".view-table").length) {
			if (item.view_options.view_detail) {
				detail_container = item.view_form.find('.view-detail');
				if (detail_container) {
					height = item.view_options.detail_height;
					if (!height) {
						height = 200;
					}
					item.create_detail_table(detail_container, {height: height});
					table_height -= height;
				}
			}
			if (item.master) {
				table_height = item.master.edit_options.detail_height;
				if (!table_height) {
					table_height = 260;
				}
			}
			if (!item.table_options.height) {
				item.table_options.height = table_height;
			}
			item.create_table(item.view_form.find(".view-table"));
			if (!item.master) {
				item.open(true);
			}
		}
		return true;
	}
	
	function on_view_form_shown(item) {
		item.view_form.find('.dbtable.' + item.item_name + ' .inner-table').focus();
	}
	
	function on_view_form_closed(item) {
		if (!item.master) {
			item.close();
		}
	}
	
	function on_edit_form_created(item) {
		var detail_container = item.edit_form.find(".edit-detail");
	
		item.edit_form.find("#cancel-btn").on('click.task', function(e) { item.cancel_edit(e) });
		item.edit_form.find("#ok-btn").on('click.task', function() { item.apply_record() });
		
		if (!item.master && item.owner.on_edit_form_created) {
			item.owner.on_edit_form_created(item);
		}
	
		if (item.on_edit_form_created) {
			item.on_edit_form_created(item);
		}
			
		if (item.edit_form.find(".edit-body").length) {
			item.create_inputs(item.edit_form.find(".edit-body"));
		}
	
		if (detail_container.length) {
			item.create_detail_views(detail_container);
		}
		return true;
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
				item.cancel_edit();
			}
		}
		return result;
	}
	
	function on_filter_form_created(item) {
		item.filter_options.title = item.item_caption + ' - filters';
		// item.filter_options.close_focusout = true;
		item.create_filter_inputs(item.filter_form.find(".edit-body"));
		item.filter_form.find("#cancel-btn").on('click.task', function() {
			item.close_filter_form(); 
		});
		item.filter_form.find("#ok-btn").on('click.task', function() { 
			item.set_order_by(item.view_options.default_order);
			item.apply_filters(item._search_params); 
		});
	}
	
	function on_param_form_created(item) {
		item.create_param_inputs(item.param_form.find(".edit-body"));
		item.param_form.find("#cancel-btn").on('click.task', function() { 
			item.close_param_form();
		});
		item.param_form.find("#ok-btn").on('click.task', function() { 
			item.process_report();
		});
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
			if (item.master) {
				item.append_record();
			}
			else {
				item.insert_record();				
			}
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
	this.on_view_form_shown = on_view_form_shown;
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

function Events7() { // als.journals.email_aliases 

	function on_view_form_created(item) {
		var height = $(window).height() - $('body').height(),
			aliases,
			time_out;
		item.aliases = task.aliases.copy({handlers: false});
		item.aliases.set_fields(['id', 'alias']);
		// item.aliases.paginate = true;
		item.aliases.view_options.fields = ['alias'];
		item.aliases.create_table(item.view_form.find(".view-master"), {
			height: height,
			dblclick_edit: false
		});
		item.aliases.open({open_empty: true});	
		aliases = task.server('get_user_aliases');
		for (var i = 0; i < aliases.length; i++) {
			item.aliases.append();
			item.aliases.id.value = aliases[i][0];
			item.aliases.alias.value = aliases[i][1];
			item.aliases.post();
		}
		item.aliases.first();
		item.aliases.on_after_scroll = function(al) {
			clearTimeout(time_out);
			time_out = setTimeout(function() {
					if (al.rec_count) {
						item.filters.alias_path.value = al.id.value;
						item.open(true);
					}
					else {
						item.open({open_empty: true});
					}
				},
				100
			);
		};
		item.aliases.on_after_scroll(item.aliases);
		
		item.create_table(item.view_form.find(".view-detail"), {height: height});
		item.add_button(item.view_form.find(".form-footer"), 'Save').click(function() {
			item.server('save_to_file', [item.alias_path.value]);
		});
	}
	
	function on_before_post(item) {
		item.added_date.value = new Date();
		item.alias_path.value = item.aliases.id.value;
	}
	this.on_view_form_created = on_view_form_created;
	this.on_before_post = on_before_post;
}

task.events.events7 = new Events7();

})(jQuery, task)