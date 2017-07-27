/*
 *
 */
"use strict";

goog.provide("Entry.PyToBlockParser");

goog.require("Entry.KeyboardCode");
goog.require("Entry.TextCodingUtil");
goog.require("Entry.TextCodingError");

Entry.PyToBlockParser = function(blockSyntax) {
    this._type ="PyToBlockParser";
    this.dic = blockSyntax["#dic"];
    delete blockSyntax["#dic"];
    this.blockSyntax = blockSyntax;

    this._funcMap = {};
};

(function(p){
    p.util = Entry.TextCodingUtil;

    p.binaryOperator = {
            '==': "EQUAL",
            '>': "GREATER",
            '<': "LESS",
            '>=': "GREATER_OR_EQUAL",
            '<=': "LESS_OR_EQUAL",
    };

    p.arithmeticOperator = {
            '+': "PLUS",
            '-': "MINUS",
            '*': "MULTIFLY",
            '/': "DIVIDE"
    };

    p.Programs = function(astArr) {
        try {
            return this.processPrograms(astArr);
        } catch(error) {
            var err = {};
            err.title = error.title;
            err.message = error.message;
            err.line = error.line;
            throw err;
        }
    };

    p.processPrograms = function(astArr) {
        return astArr.map(this.processNode, this)
    };

    p.Program = function(component) {
        var thread = component.body.map(this.processNode, this);

        if(thread[0].constructor == Array)
            return thread[0];
        else
            return thread;
    };

    p.ExpressionStatement = function(component) {
        return this.processNode(component.expression);
    };

    p.CallExpression = function(component) {
        var callee = component.callee;
        var property = component.property;
        var name = property.name;
        var args = component.arguments;
        var params = [];
        var obj = this.processNode(callee);

        if(component.arguments) {
            obj.params = this.processArguments(
                obj.type,
                component.arguments
            )
        }

        return obj;
    };

    p.Identifier = function(component, paramMeta, paramDefMeta) {
        return component.name;
    };

    p.VariableDeclaration = function(component) {};

    p.VariableDeclarator = function(component) {};

    p.AssignmentExpression = function(component) {};

    p.Literal = function(component, isLiteral) {
        if (isLiteral)
            return component.value;

        switch(typeof component.value) {
            case "boolean":
                return { type: component.value ? "True" : "False" }
            default:
                return {
                    type: 'number',
                    params : [ component.value ]
                }
        }
    };

    // p.ParamBlock = function(value, paramMeta, paramDefMeta) {};

    // p.ParamAngle = function (value, paramMeta, paramDefMeta) {};

    // p.ParamTextInput = function(value, paramMeta, paramDefMeta) {};

    // p.ParamColor = function(value, paramMeta, paramDefMeta, textParam) {};

    // p.ParamDropdown = function(value, paramMeta, paramDefMeta, textParam) {};

    // p.ParamDropdownDynamic = function(value, paramMeta, paramDefMeta, textParam, currentObject) {};

    // p.ParamKeyboard = function(value, paramMeta, paramDefMeta) {};

    // p.Indicator = function(blockParam, blockDefParam, arg) {};

    p.MemberExpression = function(component) {
        var obj = component.object;
        var property = component.property;
        var result = {};
        var blockInfo = this.blockSyntax[obj.name][this.processNode(property)];

        if(property && property.type){
            result.type = blockInfo.key;
        }

        return result;
    };

    // p.WhileStatement = function(component) {};

    p.BlockStatement = function(component) {
        return component.body.map(this.processNode, this);
    };

    // p.IfStatement = function(component) {};

    //  p.ForStatement = function(component) {};

    // p.ForInStatement = function(component) {};


    p.BreakStatement = function(component) {
        return {
            type: this.blockSyntax.break.key
        }
    };

    // p.UnaryExpression = function(component) {};

    p.LogicalExpression = function(component) {
        return {
            type: this.dic[component.operator],
            params: [
                this.processNode(component.left),
                undefined,
                this.processNode(component.right)
            ]
        }
    };

    p.BinaryExpression = function(component) {
        var operator = component.operator,
            blockType;
        if (this.binaryOperator[operator]) {
            blockType = "boolean_basic_operator";
            operator = this.binaryOperator[operator];
        } else if (this.arithmeticOperator[operator]) {
            blockType = "calc_basic";
            operator = this.arithmeticOperator[operator];
        } else {
            throw new Error("Not supported operator " + component.operator);
        }
        return {
            type: blockType,
            params: [
                this.processNode(component.left),
                operator,
                this.processNode(component.right)
            ]
        };
    };

    // p.UpdateExpression = function(component) {};

    p.FunctionDeclaration = function(component) {
        var blockName = this.processNode(component.id);
        var blockInfo = this.blockSyntax['def '+blockName];
        var type = {};
        var ThreadArr = [type];
        var funcDef = component.body.body[0].argument.callee.object.body.body.map(this.processNode , this);

        if(blockInfo){
            type.type = blockInfo.key;
        }

        for(var i=0; i<funcDef.length; i++) {
            ThreadArr.push(funcDef[i]);
        }

        return ThreadArr;
    };

    // p.FunctionExpression = function(component) {};

    p.ReturnStatement = function(component) {
        return component.argument.map(this.processNode , this );
    };

    // p.ThisExpression = function(component) {};

    // p.NewExpression = function(component) {};

    /**
     * Not Supported
     */

    // p.RegExp = function(component) {};

    // p.Function = function(component) {};

    // p.EmptyStatement = function(component) {};

    // p.DebuggerStatement = function(component) {};

    // p.WithStatement = function(component) {};

    // p.LabeledStatement = function(component) {};

    // p.ContinueStatement = function(component) {};

    // p.SwitchStatement = function(component) {};

    // p.SwitchCase = function(component) {};

    // p.ThrowStatement = function(component) {};

    // p.TryStatement = function(component) {};

    // p.CatchClause = function(component) {};

    // p.DoWhileStatement = function(component) {};

    // p.ArrayExpression = function(component) {};

    // p.ObjectExpression = function(component) {};

    // p.Property = function(component) {};

    // p.ConditionalExpression = function(component) {};

    // p.SequenceExpression = function(component) {};

    // p.searchSyntax = function(datum) {};

    /**
     * util Function
     */

    p.callFunc = function(component , type) {
        var arr = component[type];

        arr.map(function(a){
            this[component.type](a);
        } ,this);
        return;
    };

    p.processArguments = function(blockType, args) {
        var blockSchema = Entry.block[blockType];
        var syntax = this.getPySyntax(blockSchema);

        var indexes = syntax.match( /\d+/g, '');
        if (!indexes)
            return []
        var sortedArgs = new Array();

        for(var i=0; i < indexes.length; i++) {
            var idx = parseInt(indexes[i])-1;
            sortedArgs[idx] = args[i];
        }

        var results = sortedArgs.map(function(arg, index) {
            return this.processNode(
                arg,
                (arg.type === "Literal" && blockSchema.params[index].type !== "Block") ? true : undefined
            );
        }, this);

        return results;
    };

    p.processNode = function(nodeType, node) {
        var hasType = false;
        if (typeof nodeType === "string" && nodeType !== node.type)
            throw new Error("Not expected node type");
        else if (typeof nodeType === "string")
            hasType = true;

        var args = Array.prototype.slice.call(arguments);
        if (hasType) args.shift();

        node = args[0];

        if (!this[node.type])
            throw new Error(node.type + " is not supported");
        return this[node.type].apply(this, args);
    };


    p.getPySyntax = function(blockSchema) {
        var syntaxObj = blockSchema.syntax.py[0];
        return syntaxObj.syntax || syntaxObj;
    };

})(Entry.PyToBlockParser.prototype);
