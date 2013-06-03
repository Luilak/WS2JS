/*
 * @author: Luilak
 * @License: the MIT License
 */

var WS2JS = (function () {

  var whiteSpace = " \t\n";

  var convertTable = {
    "00([01]*)2" : "stack.push(_0);",
    "020" : "stack.push(stack[stack.length - 1]);",
    "010([01]*)2" : "stack.push(stack[stack.length - 1 - (_0)]);",
    "021" : "stack.push(stack.pop(), stack.pop());",
    "022" : "--stack.length;",
    "012([01]*)2" : "stack[(buf = stack.length - (_0)) - 1] = stack.pop(); stack.length = buf;",
    "1000" : "stack.push(stack.pop() + stack.pop());",
    "1001" : "stack.push(-stack.pop() + stack.pop());",
    "1002" : "stack.push(stack.pop() * stack.pop());",
    "1010" : "buf = stack.pop(); stack.push(Math.floor(stack.pop() / buf));",
    "1011" : "buf = stack.pop(); stack.push(stack.pop() % buf);",
    "110" : "buf = stack.pop(); heap[stack.pop()] = buf;",
    "111" : "stack.push(heap[stack.pop()]);",
    "200([01]*)2" : "case _1:\n",
    "201([01]*)2" : "callStack.push(_2); label = _1; break; case _2:",
    "202([01]*)2" : "label = _1; break;",
    "210([01]*)2" : "if (!stack.pop()) { label = _1; break;}",
    "211([01]*)2" : "if (stack.pop() < 0) { label = _1; break;}",
    "212" : "label = callStack.pop(); break;",
    "222" : "label = 1; break;",
    "1200" : "WS2JS.putc(stack.pop());",
    "1201" : "WS2JS.putn(stack.pop());",
    "1210" : "WS2JS.getc(function (c) { heap[stack.pop()] = c; main(_2);}); label = 2; break; case _2:",
    "1211" : "WS2JS.getn(function (n) { heap[stack.pop()] = n; main(_2);}); label = 2; break; case _2:",
    ".{1,2}$" : ""
  };

  var wsreg = (function (a) {
    for (var i in convertTable)
      a.push(i);
    return new RegExp(a.join("|"), "g");
  })([]);

  function defaultMethod() {

    var inputBuffer = "", inputBufferIndex = 0;

    function getInput() {
      if (!inputBuffer || inputBuffer.length <= inputBufferIndex) {
        inputBuffer = prompt("");
        if (inputBuffer !== null) {
          document.write(inputBuffer);
          inputBuffer += "\n";
        }
        document.write("<BR>");
        inputBufferIndex = 0;
      }
    }

    return {

      putc : function (c) {
        document.write(c === 10 ? "\n<BR>" : String.fromCharCode(c));
      },

      putn : function (n) {
        document.write(n);
      },

      getc : function (callback) {
        getInput();
        var c = inputBuffer === null ? -1 : inputBuffer.charCodeAt(inputBufferIndex++);
        setTimeout(function () { callback(c);}, 0);
      },

      getn : function (callback) {
        getInput();
        var s = (inputBuffer||"").substr(inputBufferIndex), n = parseInt(s, 10) || 0;
        if (inputBuffer)
          inputBufferIndex += s.indexOf("\n") + 1;
        setTimeout(function () { callback(n);}, 0);
      },

      onExit : function () {
        document.write("\n");
        document.close();
      }

    };
  }

  var wtoj = defaultMethod();

  wtoj.convert = function (code, complete, toASCII) {

    var returnLabel = 3, index = 0;

    return "(function (stack, heap, callStack, main, buf) {\n\n" + (complete ? "  var WS2JS = (" + defaultMethod + ")();\n\n" : "") +
      "  (main = function (label, end) { do switch(label) {\n\n    case 0:\n\n" +
      code.replace(/\r\n|\r/g, "\n").replace(/\s|\S/g, function (s, n){ n = whiteSpace.indexOf(s); return n < 0 ? "" : n;}).replace(wsreg, function (s) {

        if (arguments[arguments.length - 2] !== index)
          throw new Error("Invalid character : " + index);
        index += s.length;

        for (var i in convertTable) if ((new RegExp("^" + i + "$")).test(s)) {
          var ret = convertTable[i];
          break;
        }

        var isLabel = i === "200([01]*)2", arg = RegExp.$1, repList = [
          (arg.charAt(0) === "1" ? -1 : 1) * (parseInt(arg.substr(1), 2) || 0),
          "'" + (toASCII ? arg.replace(/.{8}/g, function(s) { return String.fromCharCode(parseInt(s, 2));}).replace(/'/g, "\\'") : arg) + "'",
          returnLabel++
        ];

        return (isLabel ? "\n" : "  ") + "    " + ret.replace(/_([0-2])/g, function (s, n) { return repList[n];}) + "\n";

      }) + "\n    case 1:\n\n      WS2JS.onExit();\n\n    case 2:\n\n      end = 1; break;\n\n  default: throw new Error('Invalid label :' + label);} while (!end);})(0);\n\n})([], {}, []);\n\n";

  };

  return wtoj;

})();
