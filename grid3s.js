(function ($) {

    $.fn.g3s = function (options) {

        /** argumentos 
         * columns [execute]
         * {
         * field: "example",
         * title: "example",
         * hidden: true,
         * template: 'exemplo',
         * editor: function(){},
         * width:100,
         * schema:{
         *      type: "int"
         * }
         * }
         * toolbar [execute]
         * {
         * template: "example",
         * click: function(){}
         * }
         * deleteRow [execute]
         * deleteRow:  function(e){ e.deleteRow(this); }
         * edit [execute]
         * edit: function(){}
         * chengeRow [execute]
         * chengeRow: function(e){}
         * blockChange [execute]
         * blockChange: function(e){}
        */
        var argnts = options || {},
            g3s = function (o) {
                return new g3s.data.exec(o);
            },
            schemaType = function (SymbolOptions, dataItem, fild, input) {
                var schema = SymbolOptions.schema;
                if (schema) {

                    /** editar linhas */
                    if (schema.type == "float" && input)
                        input.val(("" + dataItem[fild]).replace(/[.]/g, ","));

                    if (schema.type == "int" && input)
                        input.val(parseInt(dataItem[fild] || 0));


                    /** salvar linhas na grid */
                    if (schema.type == "float" && !input)
                        dataItem[fild] = parseFloat((("" + dataItem[fild]) || '0,00').replace(/[,]/g, ".").replace(/[\t\s\n]/g, ""));

                    if (schema.type == "int" && !input)
                        dataItem[fild] = parseInt(("" + dataItem[fild]).replace(/[\t\s\n]/g, "") || 0);
                }
            };

        // metodos da função
        g3s.data = g3s.prototype = {
            options: options,
            deleteRow: function (row) {
                var ar = new Array();
                this.dataSource.data().find(x => {
                    if (x.uid !== row.dataItem.uid)
                        ar.push(x);
                });

                this.dataSource._data = ar;
                /** remover linhas na grid */
                $("tr[data-uid='" + row.dataItem.uid + "']").remove();

            },
            canselRow: function (row, callback) { },
            chengeRow: function (e) {
                if (typeof this.options.chengeRow == "function")
                    this.options.chengeRow(e);

            },
            addRow: function (dataItem) {

                /** validar linhas */
                if (typeof this.options.edit == "function") {
                    if (this.options.edit.call($("null"), this) == false) {
                        return $("null");
                    }
                }

                var t = this,
                    uid = ["uid", ["", Math.random()].join("").split(".")[1]].join(""),
                    row = $("<tr />", { "data-uid": uid }),
                    grid = t.sender.element,
                    bgroup = grid.find(".g3s-body > table colgroup"),
                    rowItem = { uid: uid };

                ((t.options || {}).columns || []).find(
                    x => {

                        rowItem[x.field] = dataItem ? (typeof dataItem[x.field] == 'undefined' ? "" : dataItem[x.field]) : "";
                        if (x.hidden !== true) {
                            var td = $("<td />");
                            td.get(0).SymbolOptions = x;
                            schemaType(td.get(0).SymbolOptions, rowItem, x.field);
                            t.template.call(td, rowItem, td.get(0).SymbolOptions);
                            //td.html(rowItem[x.field]);
                            td.on("click", function (e) {
                                if ((t.getEditRow() || [])[0] !== this.closest("tr")) {
                                    t.editRow(this.closest("tr"));
                                    $(this).find("input:not([type=hidden]), button").focus();
                                }
                            });
                            row.append(td);
                        }
                    }
                );

                row.get(0).dataItem = rowItem;
                t.dataSource._data.push(rowItem);

                bgroup.html("");
                grid.find(".g3s-body > table tbody").append(row);
                grid.find(".g3s-header > table colgroup col").each(function (index) {
                    var th = grid.find(".g3s-header > table tr > th:eq(" + index + ")");

                    if (!th.get(0).widthInit)
                        th.get(0).widthInit = Math.round(th.width());

                    $(this).width(th.get(0).widthInit || th.width());

                    bgroup.append(this.cloneNode(true));
                });

                return row;
            },
            editRow: function (row) {
                var tih = this;

                if (typeof this.options.blockChange === "function") {
                    if (this.options.blockChange.call(this, this) == false)
                        return true;
                }

                tih.saveRow();
                $(row).find("td").each(function () {
                    var input = $("<input />", { name: this.SymbolOptions.field, id: this.SymbolOptions.field, autocomplete: "off" }),
                        tr = this.closest("tr"),
                        synbo = this;

                    input.val(tr.dataItem[this.SymbolOptions.field]);
                    schemaType(this.SymbolOptions, tr.dataItem, this.SymbolOptions.field, input);
                    $(this).html(input);
                    if (typeof this.SymbolOptions.editor == "function") {
                        this.SymbolOptions.editor.call(input, this.SymbolOptions, tr.dataItem);
                    }

                    /** navegar com o enter e tabs na grid */

                    $(this).find("input:not([type=hidden])").on("keydown", function (e) {
                        var it = this;
                        if ([9, 13, 16, 46].indexOf(e.keyCode) > -1) {
                            e.preventDefault();
                        }

                        // tih.options.deleteRow
                        if (e.keyCode == 46) {
                            return (() => {

                                var td = it.closest("td"),
                                    tr = td.closest("tr");

                                if (typeof tih.options.deleteRow == "function")
                                    return tih.options.deleteRow.call(tr, tih);

                                tih.deleteRow(tr);

                            })();
                        }

                        if (e.shiftKey == true && e.keyCode == 9) {
                            var td = it.closest("td"),
                                tr = td.closest("tr"),
                                i = tr.querySelectorAll("td").length - 1,
                                init = false,
                                include = false;

                            for (; i >= 0; i--) {

                                if (init == true) {
                                    if (tr.querySelectorAll("td")[i]) {
                                        if (tr.querySelectorAll("td")[i].disabled !== true && !tr.querySelectorAll("td")[i].getAttribute("readonly")) {
                                            $(tr.querySelectorAll("td")[i]).find("input:not([type=hidden])").focus();
                                            include = true;
                                            break;
                                        }
                                    }
                                }
                                if (tr.querySelectorAll("td")[i] == td) {
                                    init = true;
                                }
                            }

                            if (!include) {
                                if ($(tr).prev().get(0)) {
                                    $(it).blur();
                                    tih.editRow($(tr).prev().get(0));
                                    $(tr).prev().find("td:not([readonly])").last().find("input:not([type=hidden])").focus();
                                } else {
                                    $(it).blur();
                                    tih.saveRow();
                                }
                            }
                            return true;
                        }

                        if (e.keyCode == 9 || e.keyCode == 13) {
                            var td = it.closest("td"),
                                tr = td.closest("tr"),
                                i = 0,
                                init = false,
                                include = false;

                            for (; i < tr.querySelectorAll("td").length; i++) {

                                if (init == true) {
                                    if (tr.querySelectorAll("td")[i]) {
                                        if (tr.querySelectorAll("td")[i].disabled !== true && !tr.querySelectorAll("td")[i].getAttribute("readonly")) {
                                            $(tr.querySelectorAll("td")[i]).find("input:not([type=hidden])").focus();
                                            include = true;
                                            break;
                                        }
                                    }
                                }
                                if (tr.querySelectorAll("td")[i] == td) {
                                    init = true;
                                }
                            }

                            if (!include) {
                                if ($(tr).next().get(0)) {
                                    $(it).blur();
                                    tih.editRow($(tr).next().get(0));
                                    $(tr).next().find("td:eq(0) input:not([type=hidden])").focus();
                                } else {
                                    $(it).blur();
                                    tih.saveRow();
                                    tih.openRow();
                                    $(tr).next().find("td:eq(0) input:not([type=hidden])").focus();
                                }
                            }
                        }
                    });


                    $(this).find("input:not([type=hidden])").on("change", function (e) {
                        tih.chengeRow({
                            preventDefault: e.preventDefault,
                            dataItem: tr.dataItem,
                            options: synbo.SymbolOptions,
                            input: $(this),
                            td: $(synbo),
                            tr: $(tr),
                            value: this.value
                        });
                    });


                });
                if (typeof tih.options.edit == "function") {
                    if (tih.options.edit.call($(row), tih) == false) {
                        return (t => {
                            t.saveRow();
                            t._thisEditRow = false;

                        })(tih);
                    }
                }
                tih._thisEditRow = $(row);
                return tih._thisEditRow;
            },
            openRow: function () {
                if (typeof this.options.blockChange === "function") {
                    if (this.options.blockChange.call(this, this) == false)
                        return true;
                }
                /** abrir uma linha nova */
                if (this.getEditRow() !== false)
                    return this.editRow(this.addRow());
            },
            saveRow: function () {
                var sender = this;
                if (this.getEditRow() !== false) {
                    var row = this.getEditRow().get(0);
                    $(row).find("td input:not([type=hidden])").each(function () {
                        var t = this,
                            td = $(this.closest("td")),
                            schema = td.get(0).SymbolOptions.schema,
                            names = "";
                        if (t.name) {
                            names = t.name;
                            row.dataItem[t.name] = t.value;
                        } else {
                            var input = td.find("input[name]");
                            row.dataItem[input.get(0).name] = t.value;
                            names = input.get(0).name;
                        }

                        schemaType(td.get(0).SymbolOptions, row.dataItem, names);
                        sender.template.call(td, row.dataItem, td.get(0).SymbolOptions);

                        if (typeof td.get(0).SymbolOptions.template !== "function")
                            this.remove();
                    });

                    this._thisEditRow = false;
                }

                if (typeof sender.options.dataBound == "function")
                    sender.options.dataBound.call(sender, sender, this.getEditRow());

            },
            getEditRow: function () {
                return $(this._thisEditRow);
            },
            _thisEditRow: false,
            template: function (dataItem, SymbolOptions) {
                this.html(((tmp, t) => {

                    if (typeof tmp == "function")
                        return tmp.call(t, dataItem);

                    return "<span class='cel-span'><span class='cel-span'>" + dataItem[SymbolOptions.field] + "</span></span>";

                })(SymbolOptions.template, this));
            }
        };


        if (typeof Symbol === "function") {
            g3s.data[Symbol.iterator] = new Array()[Symbol.iterator];
        }

        exec = g3s.data.exec = function (o) {
            for (var i in o) {
                this[i] = o[i];
            }

            return this;
        };

        exec.prototype = g3s.data;

        return this.each(function () {

            /** create extrutura */
            var t = this,
                tJQ = $(t),
                html = [
                    '<div class="g3s-title"></div>',
                    '<div class="g3s-worksheet"><div class="cellfocus"></div><div class="cellfocus-scroll"></div></div>',
                    '<div class="g3s-content">',
                    '<div class="g3s-header"><table><colgroup></colgroup><thead><tr></tr></thead></table></div>',
                    '<div class="g3s-body"><table><colgroup></colgroup><tbody></tbody></table></div>',
                    '<div class="g3s-footer"><table><colgroup></colgroup><tbody></tbody></table></div>',
                    '</div>'
                ].join("");

            tJQ.attr("data-role", "grid");
            tJQ.addClass("g3s");
            tJQ.html(html);

            /** criar handler grid */
            tJQ.data("g3s", g3s({
                sender: { element: tJQ },
                options: argnts,
                dataSource: {
                    data: function (data) {

                        var t = this,
                            sender = tJQ.data("g3s");

                        if (!data)
                            return t._data;

                        tJQ.find(".g3s-body table tbody").html("");
                        t._data = new Array();

                        data.find(x => {
                            tJQ.data("g3s").addRow(x);
                        });

                        if (typeof sender.options.dataBound == "function")
                            sender.options.dataBound.call(sender, sender, g3s.data.getEditRow());

                        return t._data;
                    },
                    _data: new Array()
                },
            }));

            /** execute parametros */

            var tTitle = tJQ.find(".g3s-title"),
                tHeader = tJQ.find(".g3s-header table"),
                tBody = tJQ.find(".g3s-body table"),
                tr = tHeader.find("thead tr"),
                colgroup = tHeader.find("colgroup"),
                colgroupBody = tBody.find("colgroup");

            tHeader.css("width", "calc(100% - " + ($(".g3s-header table").width() - $(".g3s-body table").width()) + "px)");

            (argnts.toolbar || []).find(toolbar => {
                if (toolbar.template) {
                    var elem = $(toolbar.template);

                    if (!elem.get(0)) {
                        tTitle.append(toolbar.template);
                    }
                    else {
                        elem.each(function () {
                            if (typeof toolbar.click == "function")
                                $(this).on("click", function (e) {
                                    toolbar.click.call(this, tJQ.data("g3s"));
                                });

                            tTitle.append(this);
                        });
                    }

                }
            });

            (argnts.columns || []).find(columns => {

                if (columns.hidden !== true) {
                    var col = $("<col />"),
                        th = $("<th />");

                    th.html("<span>" + (columns.title || (columns.field || "")) + "</span>");

                    if (columns.width) {
                        col.width(parseInt(columns.width));
                    }

                    colgroup.append(col);
                    colgroupBody.append(col.get(0).cloneNode(true));

                    tr.append(th);
                }

            });
            /** created columns header [end]*/
        });
    };

})($);

/** criar row para edentificar o cursor no mobile */
function createRowShell(tr) {
    /** ativar sé for mubile... */
    if (touch()) {

        var g = this,
            worksheet = g.sender.element.find(".g3s-worksheet .cellfocus-scroll"),
            content = g.sender.element.find(".g3s-content .g3s-body"),
            header = g.sender.element.find(".g3s-content .g3s-header");

        worksheet.html("");

        content.find("tr").each(function (i, r) {
            var div = $("<div />", { class: "cellfocus" });

            div.html(i + 1);
            worksheet.append(div);
            if (this === (tr ? tr.get(0) : false)) {
                div.addClass("cellfocus-color");

                /** adicionar focus nas colunas do header */

                tr.find("input").on("focus", function () {
                    var td = this.closest("td"), position = 0;
                    $(this).closest("tr").find("td").each(function () {
                        if (this == td) {
                            var th = $(header.find("th").get(position));
                            $(header.find("th")).not(th).removeClass("cellfocus-color");
                            th.addClass("cellfocus-color");
                        }
                        position = position + 1;
                    });
                });


            }
        });

        if (!g.sender.element.get(0).activeScrollEvents) {
            g.sender.element.get(0).activeScrollEvents = true;
            content.on("scroll", function (e) {
                worksheet.scrollTop($(this).scrollTop());
            });
        }
    }

};