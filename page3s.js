Chart.defaults.pointHitDetectionRadius = 1;
Chart.defaults.plugins.tooltip.enabled = false;
Chart.defaults.plugins.tooltip.mode = 'index';
Chart.defaults.plugins.tooltip.position = 'nearest';
Chart.defaults.color = 'rgba(44, 56, 74, 0.95)';
Chart.defaults.plugins.tooltip.external = external;

const bdCach = "default";
const hostname = document.querySelector("html").getAttribute("hostname"),
    touch = function () {
        return (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent) || /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(navigator.userAgent)) ? true : false;
    },
    yearDataSource = function (max) {
        var source = [], year = new Date().getFullYear();
        for (var r = 0; r < max; r++) {
            source.push({ year: [year - r, ""].join("") });
        }
        return source;
    },
    realNumber = {
        set: function (number) {
            var number = ("" + number).replace(/[\s]/g, "");
            return parseFloat(('' + number).replace(/[,]/g, '.') || 0);
        },
        get: function (number) {
            return ('' + number).replace(/[.]/g, ',') || 0;
        }
    },
    extensionMounth = {
        mouth: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        getObjMouth: function () {
            let t = this, data = new Array();
            t.mouth.find((x, i) => {
                data.push({ id: i, name: x });
            });

            return data;
        },
        get: function (mes) {
            if (typeof mes == "undefined")
                return this.getObjMouth();

            return this.getObjMouth()[parseInt(mes)];
        },
        optimezeChart: function (args) {
            var modelMrz = [],
                fix = [],
                mozr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                total = 0,
                novo = new Array(),
                countOnj = function (args, x) {
                    if (args.countFild)
                        return realNumber.set(x[args.countFild]);
                    return 1;
                };
            args.dataSource.find(x => {
                var d = x[args.fild].split(" ")[0],
                    r = d.split(/[-]/)[1]; // resgatar apenas o mes
                if (fix.indexOf(r) == -1) {
                    fix.push(r);
                    modelMrz.push({ month: r, value: countOnj(args, x) });
                } else {
                    modelMrz[fix.indexOf(r)].value = realNumber.set(modelMrz[fix.indexOf(r)].value) + countOnj(args, x);
                }
            });

            modelMrz.find(x => {
                mozr[parseInt(x.month) - 1] = x.value;
            });


            /** converter os valores em percentagens */
            if (args.percent === true) {
                function add(accumulator, a) {
                    return accumulator + a;
                }
                total = mozr.reduce(add, 0);
                novo = new Array();
                mozr.find(x => {
                    novo.push(x * 100 / total);
                });

                return novo;
            }

            return mozr;
        }
    },

    formatCurrency = function (number) {
        var men = (number).toLocaleString('en-US', {
            currency: 'USD',
        }), filter = men.replace(/[,]/g, ' ').replace(/[.]/g, ','), a;

        a = filter.split(",");
        if (a.length == 1)
            filter = filter + ',00';

        if (a[1]) {
            var s = a[1];
            if (s.length == 1) {
                filter = a[0] + ',' + a[1] + '0';
            }
        }

        return filter;
    },

    /**
         * imprimir file blob
         */
    upload = async function (blob, info) {
        var send,
            form = new FormData();

        form.append("acess", info.acess);
        form.append("painelID", info.painelID);
        form.append("painel", info.painel);
        form.append("nome", info.nome);
        form.append("size", info.size);
        form.append("type", info.type);
        form.append("blob", blob);

        send = await fetch(info.url, {
            method: "POST",
            body: form
        });
        return send.json();
    },

    print = function (
        blob,
        callback = () => { }
    ) {

        // sé for mobile baixar o pdf
        if (touch())
            return window.open(blob), callback({ print: 400, blob: blob });

        var doc = document,
            ifr = doc.createElement("IFRAME"),
            t = 0;
        ifr.src = blob;
        ifr.classList.add('ifr');
        doc.querySelectorAll(".ifr").forEach(x => { x.remove() });
        ifr.onerror = () => {
            ifr.remove();
            callback(null);
        };
        ifr.onload = () => {
            /** imprimir documento */
            ifr.contentWindow.focus();
            ifr.contentWindow.print();
            return setTimeout(() => {
                clearInterval(t);
                t = setInterval(() => {
                    if (doc.hasFocus())
                        return (() => {
                            callback({ print: 400, blob: blob });
                            clearInterval(t);
                        })();
                });
            }, 5e3);
        };
        document.body.append(ifr);
    },
    createObjectUpdate = function (arg) {
        /**
        * argumentos
        * arg.form
        * arg.submit
        */

        $(arg.form).find("input[id],textarea[id]").each(function () {
            this.historyValue = this.value;
        });

        $(arg.form).on("submit", function (e) {
            var arr = null;
            $(this).find("input[id],textarea[id]").each(function () {
                if (this.historyValue !== this.value) {
                    if (arr == null)
                        arr = {};
                    arr[this.name] = this.value;
                    k = true;
                }
            });

            arg.submit.call(this, e, arr);
        });

    },
    renderJson = function (data, options) {
        var arr = new Array();
        data.find(r => {
            var line = {};

            options.filds.find(e => {
                line[e.title] = r[e.fild];
            });

            arr.push(line);
        });

        return arr;
    },
    pageXLSX = function (arg) {
        if (typeof XLSX !== "undefined") {
            var arg = arg || {},
                wb = XLSX.utils.book_new();
            wb.Props = {
                Title: arg.Title || "New Document",
                Subject: arg.Subject || "Test",
                Author: arg.Author || "Severino Web Master",
                CreatedDate: new Date()
            };
            wb.SheetNames.push("Test Sheet");
            var ws = XLSX.utils.json_to_sheet(arg.json || [{ error: 'sem nenhum parametro' }]);
            wb.Sheets["Test Sheet"] = ws;
            XLSX.writeFile(wb, (arg.fileName + (new Date().toLocaleString().replace(/[\s,:/]/g, "")) + '.xlsx'), { bookType: 'xlsx', type: 'binary' });
        }
    },
    srcToBase64 = function (src, maxW, maxH, callback, options) {
        var canvas = document.createElement('CANVAS');
        var ctx = canvas.getContext("2d");
        img = document.createElement('img'),
            img.src = src;
        img.onerror = function () {
            callback(null);
        };
        img.onload = function () {

            var oWidth = this.width
                , oHeight = this.height
                // coordenadas origem (source)
                , sx = 0
                , sy = 0
                , sWidth = oWidth
                , sHeight = oHeight
                // tamanho destino
                , dWidth = maxW
                , dHeight = maxH
                // tamanho ideal
                , iWidth = Math.round(sHeight / dHeight * dWidth)
                , iHeight = Math.round(sWidth / dWidth * dHeight);
            if (sWidth > iWidth) { // cortar na larguraa
                sx = parseInt((sWidth - iWidth) / 2);
                sWidth = iWidth;
            } else if (sHeight > iHeight) { // cortar na altura
                sy = parseInt((sHeight - iHeight) / 2);
                sHeight = iHeight;
            }
            canvas.width = dWidth;
            canvas.height = dHeight;
            if (options)
                ctx.globalAlpha = 0.08;
            ctx.drawImage(this, sx, sy, sWidth, sHeight, 0, 0, dWidth, dHeight);
            var dataURL = canvas.toDataURL('image/png');
            callback.call({ canvas: canvas, ctx: ctx }, dataURL);
            canvas = null;
        };
    },
    popupPage = function (arg) {

        var arg = arg || {};

        /**
         * configuarations
         * arg.html
         * arg.done
         */
        var popup = $("<div />", { class: "plugin-popup" }).html($("<div />", { class: "center-popup" })),
            mask = $("<div />", { class: "mask-popup" });
        popup.find(".center-popup").html(arg.html || "").promise().done(function () {
            return typeof arg.done == "function" ?
                arg.done({ element: popup }) : true;
        });

        // remover popup
        mask.on("click", function () {
            $(this).closest(".plugin-popup").remove();
        });

        popup.append(mask);

        if (!$(".plugin-popup").get(0)) {
            $("body").append(popup);
        }
    },
    progressPage = function (load) {
        if (load == true) {
            window.progressInstance = true;
            delayPage(function () {
                if (window.progressInstance) {
                    $("#open-load").addClass("focusprogres");
                }
            }, 15e2);
        } else {
            $("#open-load").removeClass("focusprogres");
            delete window.progressInstance;
        }
    },
    DateString = function (jsonDate) {
        var s = jsonDate.split(/[- :]/),
            dt = new Date(),
            a = new Date(s[0], s[1] - 1, s[2]),
            d = a.toDateString().split(/[\s]/g);

        /** sé for o mesmo dia */
        if (s[2] == dt.getDate() && s[1] == (dt.getMonth() + 1) && s[0] == dt.getFullYear())
            return [s[3], s[4]].join(":");

        return [d[2], d[1], (d[3] == dt.getFullYear() ? "" : d[3])].join(" ");
    },
    globalDataSource = JSON.parse(localStorage.userLocalstory || "{}"),
    pagerequest = document.querySelector("html").getAttribute("pagerequest") || "",
    repl = function (str) {
        return (str || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    },
    get_file_puts = function (origin, type) {
        progressPage(true);
        post('controller/aplication.php', { u: origin.split("#")[0], uid: (origin.split("#")[1] || (document.location.href.split("#")[1] || "0")) }).then(response => {
            $(".load-pages").html(response.page.file_contents).promise().done(function () {
                mapUri($(".load-pages").get(0));
                var page = $(".load-pages").find("page"),
                    title = page.attr("title"),
                    url = [hostname, origin].join(""),
                    script = page.attr("script") || "";

                if (type == "click") {

                    if (((history || {}).state || {}).origin !== origin) {
                        history.pushState({
                            url: url,
                            origin: origin,
                            title: title,
                            script: script
                        },
                            title,
                            url
                        );
                    }

                }

                if (script) {
                    var createFunctions = eval(script);
                    return typeof createFunctions == "function" ? createFunctions(response) : progressPage(false);
                }

                progressPage(false);
            });
        });
    },
    delayPage = (function () {
        var timer = 0;
        return function (callback, ms) {
            clearTimeout(timer);
            timer = setTimeout(callback, ms);
        };
    })(),
    connectViws = function (e) {
        e.preventDefault();
        if (touch()) {
            $(".show-menu").removeClass("show-menu");
        }
        return get_file_puts(this.getAttribute("href"), "click");
    },
    mapUri = function (map) {
        map.querySelectorAll("[href]:not([conected])").forEach(function (el) {
            if (!el.conected) {
                el.conected = true;
                el.setAttribute("conected", true);
                el.addEventListener("click", connectViws);
            }
        });
    };

async function post(url = '', data = {}) {
    try {
        const response = await fetch([hostname, url].join(""), {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: new URLSearchParams(data)
        });
        return response.json();
    } catch (error) {
        $("#open-load").removeClass("focusprogres");
        alert("Servidor OffLine, Tente novamente..");
    }
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(hostname + 'wspage.js', { scope: hostname })
        .then(function (registration) {
            // sucess :)
        }, function (err) {
            // registration failed :(
        });
}

function focusMenusLoad(index) {
    $(".menu-page li").removeClass("focus");
    $(".menu-page li:eq(" + index + ")").addClass("focus");
}


function logaut() {
    progressPage(true);
    post('Business/controller/utilizador.php', {
        acess: 'logaut'
    }).then(response => {
        if (response.sucess) {
            if ('serviceWorker' in navigator)
                return navigator.serviceWorker.register(hostname + 'wspage.js', { scope: hostname }).then(function (registration) {
                    registration.unregister().then(function (boolean) {
                        caches.delete(bdCach).then(function () {
                            document.location.href = hostname;
                        });
                    });
                }).catch(function (error) {
                    throw (error);
                });
        }
        document.location.href = hostname;
        progressPage(false);
    });
}

/** create autoComplite */
(function () {
    $.fn.autoCDropage = function (arg = {}) {
        return this.each(function () {
            var element = this,
                input = $("<input />", { type: "text" }),
                removeIcon = $("<span />", { class: "fa fa-times remove-dropOut" }),
                parent = $(element.parentElement),

                appendHtml = (data) => {

                    var data = data.sucess || data;

                    $(".template-outocomplite").remove();
                    var painel = $("<div />", { class: "template-outocomplite" });
                    painel.get(0).dataSource = data;

                    painel.on("mouseenter mousemove mouseover", function () {
                        input.get(0).blockEvents = true;
                    });

                    painel.on("mouseleave", function () {
                        delete input.get(0).blockEvents;
                    });

                    data.find((x, i) => {
                        var item = $("<div />", { class: "outocomplite-item" });

                        if (typeof arg.template == "function") {
                            item.html(arg.template(x));
                        } else {
                            item.html(x[arg.dataTextField]);
                        }
                        item.get(0).dataItem = x;
                        item.on("click", function () {
                            var dataIten = this.dataItem;
                            element.value = this.dataItem[arg.dataValueField];
                            input.val(this.dataItem[arg.dataTextField]);
                            input.get(0).nofilter = true;
                            input.focus();
                            if (typeof arg.select == "function") {
                                arg.select.call(input.get(0), this.dataItem);
                            }
                            parent.find(".template-outocomplite").remove();
                            if (typeof arg.close == "function") {
                                arg.close();
                            }
                        });

                        if (typeof arg.render == "function")
                            arg.render({ index: i, painel: painel, item: item });

                        painel.append(item);
                    });

                    if (painel.find(".outocomplite-item").get(0)) {
                        painel.find(".outocomplite-item").get(0).focusNavigator = true;
                        $(painel.find(".outocomplite-item").get(0)).addClass("focus-item");
                    }

                    parent.append(painel);

                    if (typeof arg.done == "function") {
                        arg.done(parent, painel, input, data.length);
                    }

                };

            if (element.autoCDropage)
                return false;

            element.autoCDropage = true;

            element.type = "hidden";

            if ($(element).attr("placeholder")) {
                input.attr("placeholder", $(element).attr("placeholder"));
            }

            removeIcon.on("click", function () {
                element.value = "";
                input.val("");
            });

            input.on("focusout", function () {
                var t = this,
                    dropDown = parent.find(".template-outocomplite");

                if (dropDown.get(0)) {

                    var saveDataSource = dropDown.get(0).dataSource;
                    var r = saveDataSource || [],
                        forr = () => {
                            for (var i = 0; i < r.length; i++) {
                                if (repl(r[i][arg.dataTextField]).indexOf(repl(t.value)) > -1) {
                                    element.value = r[i][arg.dataValueField];
                                    t.value = r[i][arg.dataTextField];
                                    if (typeof arg.select == "function") {
                                        arg.select.call(t, r[i]);
                                    }
                                    break;
                                }
                            }
                            if (typeof arg.close == "function") {
                                arg.close();
                            }

                            $(t.parentElement).find(".template-outocomplite").remove();
                        };

                    if (!t.blockEvents) {
                        forr();
                    } else {
                        delayPage(function () {
                            delete t.blockEvents;
                            forr();
                        }, 45e1);
                    }
                }
            });

            input.on("keyup keydown focus", function (e) {
                var t = this, v = t.value, arr, ser = {};

                /** triegger search events */
                if ($(element).data("autoCDropage")._search !== "") {
                    v = $(element).data("autoCDropage")._search;
                    $(element).data("autoCDropage")._search = "";
                }


                if (e.keyCode == 9 || e.keyCode == 16) { }
                else {
                    if (t.readOnly) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }

                    if (e.type == "focus") {
                        if (t.nofilter) {
                            delete t.nofilter;
                            return false;
                        }
                    }

                    if (e.type == "keydown") {
                        return ((e) => {
                            if (e.keyCode == 13) {
                                if ($(t).closest("form").get(0)) {
                                    $(t).closest("form").get(0).stopPropSubmit = true;
                                    delayPage(function () {
                                        if ($(t).closest("form").get(0))
                                            delete $(t).closest("form").get(0).stopPropSubmit;
                                    }, 15e2);
                                }
                                parent.find(".focus-item").click();
                            }

                        })(e);
                    }

                    if ([38, 40].indexOf(e.keyCode) > -1) {
                        e.preventDefault();
                    }

                    if ([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                        /** navegação painel */
                        return (() => {
                            if ([38, 40].indexOf(e.keyCode) > -1) {
                                var i = 0, itens = parent.find(".outocomplite-item");
                                for (; i < itens.length; i++) {
                                    var dir = (e.keyCode == 38 ? (i - 1) : (i + 1));

                                    if (!itens.get(dir))
                                        dir = 0;
                                    if (itens.get(dir)) {
                                        if (itens.get(i).focusNavigator) {
                                            itens.removeClass("focus-item");
                                            itens.get(dir).focusNavigator = true;
                                            $(itens.get(dir)).addClass("focus-item");
                                            delete itens.get(i).focusNavigator;

                                            element.value = itens.get(dir).dataItem[arg.dataValueField];
                                            $(t).val(itens.get(dir).dataItem[arg.dataTextField]);
                                            break;
                                        }
                                    }
                                }
                            }
                        })();
                    }

                    if (e.type == "focus" && !arg.autOpen)
                        return true;

                    arr = v.split(/[\s]/g);

                    if (arg.dataSource)
                        return (dataSource => {
                            var localSource = new Array();
                            dataSource.find(r => {
                                var valueData = repl(r[arg.dataTextField]),
                                    existFilter = false;

                                if (arg.dropDown == true) {
                                    if (valueData.includes(repl(v)))
                                        existFilter = r;
                                }

                                if (!arg.dropDown)
                                    arr.find(valueFilter => {

                                        if (valueData.indexOf(repl(valueFilter)) > -1)
                                            existFilter = r;

                                    });

                                if (existFilter)
                                    localSource.push(existFilter);

                            });


                            appendHtml(localSource);

                            /** connectar servidor... */
                            if (!localSource.length) {
                                if (arg.url) {
                                    $(element).data("autoCDropage")._search = v;
                                    arg.dataSource = undefined;
                                    return $(t).trigger("keyup");
                                }
                            }

                        })(arg.dataSource);

                    arr.find((x, i) => {
                        ser["u" + i] = x;
                        if (arr.length - 1 == i) {
                            ser.value = v;
                        }
                    });

                    delayPage(() => {
                        if (v !== "") {

                            var ojb = { type: arg.name, data: JSON.stringify(ser) },
                                rt = (a => {
                                    if (typeof a == "function")
                                        return a();
                                    return {};
                                })(arg.data);

                            if (typeof rt == 'object')
                                for (var r in rt) {
                                    ojb[r] = rt[r];
                                }

                            post(arg.url, ojb)
                                .then(function (response) {

                                    /** melhorar filter google */
                                    var newResponse = { sucess: new Array() };
                                    response.sucess.find(x => {
                                        var er = 0;
                                        arr.find(e => {
                                            if (repl(x[arg.dataTextField]).includes(repl(e)))
                                                er = er + 1;
                                        });

                                        if (er == arr.length)
                                            newResponse.sucess.push(x);

                                    });

                                    /** adicionar data source */
                                    $(element).data("autoCDropage").dataSource.data((newResponse || {}).sucess || newResponse);

                                    appendHtml(newResponse);
                                });
                        } else {
                            if (typeof arg.close == "function") {
                                arg.close();
                            }
                            $(t.parentElement).find(".template-outocomplite").remove();
                        }

                    }, 1e3);
                }

            });

            parent.append(input);
            parent.append(removeIcon);

            $(element).data("autoCDropage", {
                options: arg,
                dataSource: {
                    data: function (e) {
                        if (e) {
                            this._data = e;
                            arg.dataSource = this._data;
                            return this._data;
                        }

                        return this._data;
                    },
                    _data: arg.dataSource || new Array()
                },
                value: function (data) {
                    $(element).val(!data ? data : data[arg.dataValueField]);
                    $(input).val(!data ? data : data[arg.dataTextField]);
                    if (typeof this.options.select == "function" && data)
                        this.options.select.call(input.get(0), data);
                },
                select: function () {
                    $(input).select();
                    var r = this.dataSource.data()[0];
                    if (r)
                        this.value(r);
                },
                readonly: function (e) {
                    if (e == true) {
                        $(element).attr("readonly", "readonly");
                        $(input).attr("readonly", "readonly");
                        removeIcon.css("display", "none");
                    } else {
                        $(element).removeAttr("readonly");
                        $(input).removeAttr("readonly");
                        removeIcon.css("display", "block");
                    }
                },
                search: function (search) {
                    this._search = search;
                    $(input).val("").trigger("keyup");
                },
                _search: ""
            });

        });
    };

    $.fn.dropOptions = function (arg = {}) {
        /**
         * argumentos
         * arg.item
         * arg.item.label
         * arg.item.template
         * arg.item.click
         */
        return this.each(function () {
            var t = this, drop = $("<div />", { class: "drop-options" });
            (arg.item || []).find(row => {
                var item = $("<div />", { class: "item-drop" });
                item.get(0).options = row;
                item.html(typeof row.template == "function" ? row.template() : (row.label || ""));
                item.on("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    if (typeof row.click == "function")
                        row.click.call(this, { event: e, options: this.options });
                    return drop.toggle();
                });
                drop.append(item);
            });

            drop.append($("<div />", { style: "clear:both;" }));

            $(t).on("click", function () {
                drop.toggle();
            }).on("focusout", function () {
                drop.fadeOut();
            });

            $(t).append(drop);

        });
    };

    $.fn.triwes = function (arg = {}) {
        /**
         * argumentos
         * arg.load
         */
        return this.each(function () {
            var element = $(this),
                title = element.find(".title-options");

            title.on("click", function () {
                element.find("button.btn-option>div").toggleClass("addRotate");
                element.find(".show-options").toggle(function () {
                    if (!this.loagrid) {
                        this.loagrid = true;
                        return typeof arg.load == "function" ? arg.load({ element: this }) : true;
                    }
                });
            });
        });
    };

    $.fn.t3sNumeric = function (arg) {
        /**
         * argumentos
         * arg.decimal
         * arg.class
         * arg.keyup
         */
        var arg = arg || {};
        return this.each(function () {
            var t = this, jt = $(t);
            if (arg.class)
                jt.addClass(arg.class);

            jt.on("keydown", function (e) {
                if (e.keyCode == 32) e.preventDefault();
                if (!e.ctrlKey && (e.keyCode !== 20 || e.keyCode !== 67 || !e.keyCode == 86)) {
                    if (e.type == 'keydown' && [8, 9, 13, 37, 38, 39, 30].indexOf(e.keyCode) == -1) {
                        if ((isNaN(e.originalEvent.key) && e.originalEvent.key !== ',') || (t.value.includes(',') && isNaN(e.originalEvent.key)) || (!arg.decimal && (e.originalEvent.key == ',' || t.value.includes(','))))
                            e.preventDefault();

                        if (t.value.split(',')[1]) {
                            let num = t.value.split(',')[1];
                            if (((num + '' + e.originalEvent.key).length > arg.decimal) && (e.target.selectionStart > t.value.split(',')[0].length)) {
                                e.preventDefault();
                            }
                        }

                        if ((t.value || "").slice(0, 1) == ",") {
                            e.preventDefault();
                            t.value = 0;
                        }
                    }
                }
            });

            jt.on("keyup", function (e) {
                if (typeof arg.keyup == "function")
                    arg.keyup.call(this, e);
            });

            jt.on("focus", function (e) {
                jt.select();
            });
        });
    };
})($);


function addRowAutoCDropage(e, call) {
    if (!e.length && e.input.val() !== "") {

        var notResult = $("<div />", { class: "footer-autoComplite options" });
        if (!e.painel.find(".footer-autoComplite").get(0)) {
            e.painel.append(notResult);
            notResult.addClass("options");
            notResult.html([
                '<div class="message"><p>(0) Resultado, Click em pesquisar ou Adicionar na lista!</p></div>',
                '<div><button type="button" id="ppSearsh">Pesquisar</button> <button type="button" id="addSearsh">Adicionar na lista</button></div>'
            ].join(""));

            notResult.find("button#ppSearsh").on("click", function () {
                post(e.sender.read.url, e.sender.read.data).then(function (x) {
                    e.sender.read.db.sucess[0].global[e.sender.read.table] = rps;
                    localStorage.setItem("userLocalstory", JSON.stringify(e.sender.read.db));
                    call(rps);
                });
            });

            notResult.find("button#addSearsh").on("click", function () {
                var Formdata = {};

                for (var i in e.sender.saveData.data) {
                    if (typeof e.sender.saveData.data[i] == "function") {
                        var f = e.sender.saveData.data[i];
                        Formdata[i] = f();
                    } else {
                        Formdata[i] = e.sender.saveData.data[i];
                    }
                }

                post(e.sender.saveData.url, Formdata).then(function (x) {
                    post(e.sender.read.url, e.sender.read.data).then(function (rps) {
                        e.sender.read.db.sucess[0].global[e.sender.read.table] = rps;
                        localStorage.setItem("userLocalstory", JSON.stringify(e.sender.read.db));
                        call(rps);
                    });
                });
            });

        }
        // adicionar botão para recarregar ou adicionar na lista
    }
}

function init() {
    var doc = document;
    /** init tamplate api layout */
    /** carregar todos os scripts do layout inicial */
    //const layoutConnect = function () { };
    if ("function" === typeof layoutConnect)
        layoutConnect();
    mapUri(doc);

    window.onpopstate = function (event) {
        if ((event || {}).state)
            return get_file_puts(event.state.origin);

        return get_file_puts(pagerequest);
    };

    if (pagerequest)
        return get_file_puts(pagerequest);

};

window.onload = init;