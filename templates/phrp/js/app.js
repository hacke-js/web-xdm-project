(function () {
    var iarray = new Object();
    iarray.email_step = 1;

    let Menu = {
        navLinks: $('.header-nav-list a'),
        getCurrentPage: function () {
            let _ = this,
                locationPathname = window.location.pathname;

            $.each(_.navLinks, function () {
                let $this = $(this);
                if ($this.attr('href') === locationPathname) {
                    $this.parent().addClass('active').siblings().removeClass('active');
                }
            });
        },
        showMobileBav: function () {
            $('.header-nav-trigger').on('click', function (e) {
                e.preventDefault();
                $('.header-right').toggleClass('show-nav');
                $(this).toggleClass('show-nav');
            });
        },
        showUserMenu: function () {
            $('.header-toggle-menu').on('click', function (e) {
                e.preventDefault();
                $('.header-user').toggleClass('show-menu')
            });
        },
        init: function () {
            let _ = this;

            _.showUserMenu();
            _.showMobileBav();
            _.getCurrentPage();
        }
    };

    Menu.init();


    var chooseServer = $('.choose-server');
    $(".choose-server-title").click(function (e) {
        e.preventDefault();
        chooseServer.toggleClass("opened");
    });

    $(".choose-server li").click(function () {
        if (!$(this).hasClass('disabled')) {
            chooseServer.toggleClass("opened").find(".choose-server-title").text($(this).text());
            $('.choose-server-hidden').val($(this).data('option-value'));
        }
    });

    var errorStatus = $('.error-status');
    if (errorStatus.find('span').html()) {
        errorStatus.removeClass('hide');
    }

    function errorHandler(container, errorMessage) {
        let messageContainer = container.find('span');
        if (errorMessage) {
            $(container).removeClass('hide');
            $(messageContainer).empty();
            $(messageContainer).html(errorMessage);
        }
    }

    let notification = {
        notificationContainer: null,
        hideNotification: function () {
            let _ = this;

            $(_.notificationContainer).removeClass('show').addClass('hide');

            setTimeout(function () {
                _.notificationContainer.remove();
            }, 300);
        },
        showNotification: function () {
            let _ = this;
            setTimeout(function () {
                $(_.notificationContainer).removeClass('hide').addClass('show');
            }, 100);

            setTimeout(function () {
                _.hideNotification();
            }, 2000);
        },
        buildNotification: function (message) {
            let _ = this;
            _.notificationContainer = $('<div />').addClass('notification-container hide');
            let notificationMessageTemplate = `<span>${message}</span>`;
            let notificationItem = $('<div />').addClass('notification-item').html(notificationMessageTemplate);

            $(_.notificationContainer).appendTo($('body'));
            $(notificationItem).appendTo(_.notificationContainer);
        },
        success: function (message) {
            let _ = this;

            _.buildNotification(message);
            _.showNotification();
        }
    };

    let monitoring = {
        loadedData: null,
        copyToClipboard: function (serverIP) {
            let copyCommandSupported = document.queryCommandSupported('copy');

            if (copyCommandSupported === true) {
                let textareaTemplate = $('<textarea />').addClass('clipboard-container');
                $(textareaTemplate).val(serverIP).appendTo($('body'));
                $(textareaTemplate).select();

                try {
                    let successful = document.execCommand('copy');
                    let msg = successful ? 'IP успешно скопирован!' : 'IP не скопирован!';

                    notification.success(msg);
                } catch (err) {
                    console.log('Невозможно скопировать!');
                }
                $(textareaTemplate).remove();
            }
        },
        initListeners: function () {
            let _ = this;

            $('.copy-server-ip').on('click', function (e) {
                e.preventDefault();

                let serverIP = $(this).data('server-ip');
                _.copyToClipboard(serverIP);
            });
        },
        init: function () {
            let _ = this;

            _.initListeners();
        }
    };

    monitoring.init();

    let changeEmail = {
        step: 1,
        emailCode: null,
        changeEmailContainer: $('.profile-change-email-form'),
        errorContainer: $('.profile-change-email-form').find('.error-status-title'),
        codeInput: null,
        codeInputValue: null,
        sendEmailCode: function (newEmail) {
            let _ = this;

            $.post("/includes/back.php?func=email&step=1", {
                new_email: newEmail
            }, function (data) {
                let info = JSON.parse(data);
                if (info.success === 1) {
                    _.emailCode = info.mail.text.code;
                    $(_.codeInput).addClass('show');
                    Cookies.set('change_email_code', info.mail.text.code, {expires: 600});
                    _.step = 2;
                }

                if (info.error) {
                    _.handleErros(info.error);
                }
            });
        },

        confirmEmailCode: function () {
            let _ = this;

            if (Cookies.get('change_email_code') === _.codeInputValue) {
                $.getJSON("/includes/back.php?func=email&step=2", function (info) {
                    if (info.success) {
                        Cookies.remove('change_email_code');
                        _.onSuccessfulConfirm();
                    }
                });
            } else {
                _.handleErros('Ошибка, код введён неверно');
            }
        },

        onSuccessfulConfirm: function () {
            let _ = this;
            _.codeInput.removeClass('show');
            let formInputs = _.changeEmailContainer.find('input');

            $.each($(formInputs), function (i, input) {
                $(input).val('');
            });

            alert('Email успешно изменён');
        },

        handleErros: function (message) {
            let _ = this;
            let messageContainer = $(_.errorContainer).find('span');

            if (message) {
                $(_.errorContainer).removeClass('hide');
                $(messageContainer).empty();
                $(messageContainer).html(message);
            }
        },

        start: function () {
            let _ = this,
                newEmail = $('#new_email').val(),
                confirmEmail = $('#new_email_confirmation').val();

            _.codeInput = _.changeEmailContainer.find('.code_input_row');
            _.codeInputValue = $(_.codeInput).find('input').val();

            if (newEmail === confirmEmail) {
                if (newEmail && confirmEmail) {
                    if (Cookies.get('change_email_code')) {
                        $(_.codeInput).addClass('show');
                        if (_.codeInputValue) {
                            _.confirmEmailCode();
                        }
                    } else {
                        _.sendEmailCode(newEmail);
                    }
                } else {
                    _.handleErros('Ошибка, введите Email')
                }
            } else {
                _.handleErros('Ошибка, Email не совпадает');
            }
        },
        init: function () {
            let _ = this;
            $('.profile-change-email-button').on('click', function (e) {
                e.preventDefault();
                $(_.errorContainer).addClass('hide');
                _.start();
            });
        }
    };

    let profile = {
        profileContainer: $('.profile'),
        navTabs: {
            navLinks: $('.profile-nav a, .profile-security-nav a'),
            tabsList: $('.profile-tab'),
            init: function () {
                let _ = this;
                $.each(_.navLinks, function (i, link) {
                    $(link).on('click', function (e) {
                        e.preventDefault();
                        $(link).parent().addClass('active').siblings().removeClass('active');
                        let tabId = $(link).attr('href');
                        $(tabId).addClass('show-tab')
                            .siblings().removeClass('show-tab');
                    });
                });
            }
        },

        changeGuardKey: {
            codeInput: $('.code_secure_key'),
            changeGuardKeyContainer: $('#skey_form'),
            errorContainer: $('#skey_form').find('.error-status-title'),
            onSuccessfulConfirm: function () {
                let _ = this;
                _.codeInput.removeClass('show');
                let formInputs = _.changeGuardKeyContainer.find('input');

                $.each($(formInputs), function (i, input) {
                    $(input).val('');
                });

                alert('Защитгый код успешно установлен');
            },
            firstStep: function () {
                let _ = this,
                    newGuardkey = $('#skey').val(),
                    newGuardkeyConfirm = $('#skey1').val();

                if (newGuardkey === newGuardkeyConfirm && newGuardkey && newGuardkeyConfirm) {
                    $('.error-status-title').addClass('hide');
                    if (newGuardkey.match(/^\d*$/)) {
                        if (!Cookies.get('change_guardkey_code')) {
                            $.post("/includes/back.php?func=guard_key&step=1", {
                                new_guard_key: $('#skey').val()
                            }, function (data) {
                                let info = JSON.parse(data);
                                if (info.success === 1) {
                                    $('.code_secure_key').addClass('show');
                                    $('#submit_guardkey').find('span').html('Изменить');
                                    Cookies.set('change_guardkey_code', info.mail.text.code, {expires: 600});
                                    _.secondStep();
                                }
                                if (info.error) {
                                    errorHandler(_.errorContainer, info.error);
                                }
                            });
                        } else {
                            $('.code_secure_key').addClass('show');
                            $('#submit_change_password').find('span').html('Изменить');
                            _.secondStep();
                        }
                    } else {
                        errorHandler(_.errorContainer, "Ошибка, защитный код должен содержать только цифры!");
                    }
                } else {
                    errorHandler(_.errorContainer, "Ошибка, защитный код не совпадает!");
                }
            },
            secondStep: function () {
                let _ = this;
                $('#submit_guardkey').on('click', function (e) {
                    e.preventDefault();
                    if ($('#guardkey_code').val() === Cookies.get('change_guardkey_code')) {
                        $.getJSON("/includes/back.php?func=guard_key&step=2", function (info) {
                            if (info.success) {
                                $('.error-status-title').addClass('hide');
                                Cookies.remove('change_guardkey_code');
                                _.onSuccessfulConfirm();
                            }
                        });
                    } else {
                        errorHandler(_.errorContainer, "Ошибка, Код не совпадает!");
                    }
                });
            }
        },

        changePassword: {
            errorContainer: $('#change_password_form').find('.error-status-title'),
            firstStep: function () {
                let _ = this,
                    newPassword = $('#npass').val(),
                    newPasswordConfirm = $('#npass1').val();

                if (newPassword === newPasswordConfirm) {
                    $('.error-status-title').addClass('hide');
                    if (newPassword.match(/^[A-Za-z]\w{5,63}$/)) {
                        if (!Cookies.get('change_password_code')) {
                            $.getJSON("/includes/back.php?func=send_code", function (info) {
                                if (info.success === 1) {
                                    $('.code_password_key').addClass('show');
                                    $('#submit_change_password').find('span').html('Изменить');
                                    Cookies.set('change_password_code', info.mail.text.code, {expires: 600});
                                    _.secondStep();
                                }
                            });
                        } else {
                            $('.code_password_key').addClass('show');
                            $('#submit_change_password').find('span').html('Изменить');
                            _.secondStep();
                        }
                    } else {
                        errorHandler(_.errorContainer, "Ошибка, допустимая длина пароля от 5 до 63 символов!");
                    }
                } else {
                    errorHandler(_.errorContainer, "Ошибка, пароль не совпадает!");
                }
            },
            secondStep: function () {
                let _ = this;
                $('#submit_change_password').on('click', function (e) {
                    e.preventDefault();
                    if ($('#password_code').val() === Cookies.get('change_password_code')) {
                        $('.error-status-title').addClass('hide');
                        Cookies.remove('change_password_code');
                        $('#change_password_form').submit();
                    } else {
                        errorHandler(_.errorContainer, 'Ошибка, Код не совпадает!');
                    }
                });
            }
        },

        initListeners: function () {
            let _ = this;
            $('#submit_change_password').on('click', function (e) {
                e.preventDefault();
                _.changePassword.firstStep();
            });
            $('#submit_guardkey').on('click', function (e) {
                e.preventDefault();
                _.changeGuardKey.firstStep();
            });
        },

        init: function () {
            let _ = this;
            if (_.profileContainer.length !== 0) {
                Cookies.remove('change_password_code');
                Cookies.remove('change_guardkey_code');
                _.initListeners();
                _.navTabs.init();
                changeEmail.init();
            }
        }
    };
    profile.init();

    let vkNews = {
        container: $('#news-list'),
        excerptLength: 150,
        maxMews: 8,
        timeConverter: function (UNIX_timestamp) {
            var a = new Date(UNIX_timestamp * 1000),
                months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
                year = a.getFullYear(),
                month = months[a.getMonth()],
                date = a.getDate(),
                hour = a.getHours(),
                min = a.getMinutes(),
                sec = a.getSeconds(),
                time = date + ' ' + month + ' ' + year;
            return time;
        },
        getFirstSentence: function (text) {
            let regex = /^.*?[.!?](?:\s|$)(?!.*\))/,
                sentence = text.match(regex);
            if(sentence) {
                return sentence[0];
            }
        },
        updateImages: function() {
            $.getJSON("/includes/back.php?func=get_news_images", function (data) {
                if(data) {
                    notification.success("Обновление завершено");
                }
            });
        },
        getNews: function () {
            let _ = this;
            $.getJSON("/includes/back.php?func=get_news", function (data) {
                $.each(data.response.items, function (key, value) {
                    let firstSentence = _.getFirstSentence(value.text);

                    let newsBox = `
                        <div class="grid-item-wrap">
                            <li class="grid-item">`;
                    try {
                        let imageUrl = value['attachments'][0]['photo']['photo_604'];
                        if (imageUrl) {
                            let img = imageUrl.split('/');

                            newsBox += `<div class="news_box_thumb" style="background-image: url(/vkImages/${img[img.length - 1]})"></div>`;
                        }
                    } catch (error) {
                        newsBox += `<div class="news_box_thumb" style="background-image: url(/templates/crmp-rp-v4/images/news-default.png)"></div>`;
                    }
                    newsBox += `<div class="list_li_row">`;

                    if(firstSentence) {
                        newsBox += `<h3>${firstSentence}</h3>`
                    }

                    let textOffset = firstSentence ? firstSentence.length : 0;

                    if (textOffset < _.excerptLength) {
                        newsBox += `<p>${value.text.substring(textOffset, _.excerptLength) + '...'}</p>`;
                    }

                    newsBox +=   `<div class="read_more">
                                    <a target="_blank" href="https://vk.com/crmprp?w=wall-54290139_${value.id}">Читать далее</a>
                                    <div class="read_more_date">
                                        <img src="/templates/crmp-rp-v4/images/svg/passage-of-time.svg" alt="default">
                                        <span>${_.timeConverter(value.date)}</span>
                                    </div>
                                </div>
                            </div>
                        </li>
                    </div>
                    `;

                    if (value['text']) {

                        if ($('body').hasClass('news')) {
                            $(newsBox).appendTo(_.container);
                            if (macy) {
                                macy.recalculate();
                            }
                        } else {
                            if (key <= _.maxMews) {
                                $(newsBox).appendTo(_.container);
                                newsSlider.slick('refresh');
                            }
                        }
                    }
                });
            });
        },
        initListeners: function() {
            let _ = this;
            $('.update-images').on('click', function(event) {
                event.preventDefault();
                notification.success("Обновление начато");
                _.updateImages();
            });
        },
        init: function () {
            let _ = this;
            if (_.container.length > 0) {
                _.getNews();
            }
            _.initListeners();
        }
    };
    vkNews.init();

    if ($('body').hasClass('news')) {
        var macy = Macy({
            container: '#news-list',
            trueOrder: true,
            waitForImages: false,
            margin: 15,
            columns: 3,
            breakAt: {
                1200: 4,
                991: 2,
                520: 2,
                400: 1
            }
        });
    }

    var newsSlider = $('.slick-init');
    if (newsSlider.length !== 0) {
        newsSlider.slick({
            slidesToShow: 3,
            infinite: false,
            appendArrows: $('.new_js_article_nav'),
            prevArrow: "<span class='news-prev'></span>",
            nextArrow: "<span class='news-next'></span>",
            responsive: [
                {
                    breakpoint: 1200,
                    settings: {
                        centerMode: true,
                        infinite: true,
                        variableWidth: true,
                    }
                }
            ]
        });
    }

    function dd1() {
        $("#download_1").dialog({
            minWidth: 400,
            resizable: false
        });
    }

}());


function load_info() {
    $.getJSON("/includes/back.php?func=get_vk_count", function (data) {
        if (data.success === 1) {
            get_info(data);
        }
    });
}

function get_info(members) {
    if (members.count) {
        $('#count_official span').html(members.count.mainGroup);
        $('#count_private span').html(members.count.publicGroup);
    }
}
