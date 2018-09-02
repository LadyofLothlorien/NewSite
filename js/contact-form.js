(function (window) {
	//using regular expressions, validate email
	const contactFormUtils = window.contactFormUtils = {
		isValidEmail: function (email) {
			const regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
			return regex.test(email);
		},
		//if no form errors, remove or hide error messages
		clearErrors: function () {
			$('#emailAlert').remove();
			$('#feedbackForm .help-block').hide();
			$('#feedbackForm .form-group').removeClass('has-error');
		},
		//upon form clear remove the checked class and replace with unchecked class. Also reset Google ReCaptcha
		clearForm: function () {
			$('#feedbackForm .glyphicon').removeClass('glyphicon-check').addClass('glyphicon-unchecked').css({color: ''});
			$('#feedbackForm input,textarea').val("");
			grecaptcha.reset();
		},
		//when error, show error messages and track that error exists
		addError: function ($input) {
			const parentFormGroup = $input.parents('.form-group');
			parentFormGroup.children('.help-block').show();
			parentFormGroup.addClass('has-error');
		},
		removeError: function ($input) {
			const parentFormGroup = $input.parents('.form-group');
			parentFormGroup.children('.help-block').hide();
			parentFormGroup.removeClass('has-error');
		},
		addAjaxMessage: function (msg, isError) {
			$("#feedbackSubmit").after('<div id="emailAlert" class="alert alert-' + (isError ? 'danger' : 'success') + '" style="margin-top: 5px;">' + $('<div/>').text(msg).html() + '</div>');
		}
	};

	$(document).ready(function () {
		if ($("#phone").intlTelInput) {
			$("#phone").intlTelInput({validationScript: "assets/vender/intl-tel-input/js/isValidNumber.js"});
			$(".intl-tel-input.inside").css('width', '100%');
		}

		$("#feedbackSubmit").click(function () {
			const $btn = $(this);
			$btn.button('loading');
			contactFormUtils.clearErrors();

			//do a little client-side validation -- check that each field has a value and e-mail field is in proper format
			//use bootstrap validator (https://github.com/1000hz/bootstrap-validator) if provided, otherwise a bit of custom validation
			const $form = $("#feedbackForm");
			let hasErrors = false;
			if ($form.validator) {
				hasErrors = $form.validator('validate').hasErrors;
			}
			else {
				$('#feedbackForm input,#feedbackForm textarea').not('.optional').each(function () {
					const $this = $(this);
					if (($this.is(':checkbox') && !$this.is(':checked')) || !$this.val()) {
						hasErrors = true;
						contactFormUtils.addError($(this));
					}
				});
				const $email = $('#email');
				if (!contactFormUtils.isValidEmail($email.val())) {
					hasErrors = true;
					contactFormUtils.addError($email);
				}
				const $phone = $('#phone');
				if ($phone.val() && $phone.intlTelInput && !$phone.intlTelInput("isValidNumber")) {
					hasErrors = true;
					contactFormUtils.addError($phone.parent());
				}
			}
			//if there are any errors return without sending e-mail
			if (hasErrors) {
				$btn.button('reset');
				return false;
			}
			//send the feedback e-mail
			$.ajax({
				type: "POST",
				url: "library/sendmail.php",
				data: $form.serialize(),
				success: function (data) {
					contactFormUtils.addAjaxMessage(data.message, false);
					contactFormUtils.clearForm();
				},
				error: function (response) {
					contactFormUtils.addAjaxMessage(response.responseJSON.message, true);
				},
				complete: function () {
					$btn.button('reset');
				}
			});
			return false;
		});
		$('#feedbackForm input, #feedbackForm textarea').change(function () {
			const checkBox = $(this).siblings('span.input-group-addon').children('.glyphicon');
			if ($(this).val()) {
				const $email = $('#email');
				if (this.id === "email") {
					if (!contactFormUtils.isValidEmail($email.val())) {
						contactFormUtils.addError($email);
						checkBox.removeClass('glyphicon-unchecked').removeClass('glyphicon-checked').addClass('glyphicon-error').css({color: 'red'});
						return;
					}
				}
				checkBox.removeClass('glyphicon-unchecked').removeClass('glyphicon-error').addClass('glyphicon-check').css({color: 'green'});
				contactFormUtils.removeError($email);
			}
			else {
				checkBox.removeClass('glyphicon-unchecked').removeClass('glyphicon-error').addClass('glyphicon-unchecked').css({color: ''});
			}
		});
	});
})(window);
