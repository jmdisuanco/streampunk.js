import { fork, spawn } from "child_process";
import ProxyProcess from "../core/ProxyProcess";

import { PassThrough } from "stream";
import { Socket } from "net";

export default function ForkProcess(componentPath) {
  let args = [
    '-e', 'require("babel/register"); require(' + JSON.stringify(module.filename) + ').runChild()',
    componentPath
  ];
  return function forkProcess() {
    let sub = spawn(process.execPath, args, { stdio: [0, 1, 2, "pipe"] });
    return ProxyProcess.parent(this, sub.stdio[3], patchWriteStream(sub.stdio[3]));
  }
}

export function runChild() {
  var component = require(process.argv[1]);
  let parent = new Socket({ fd: 3 });
  ProxyProcess.child(component, parent, parent);
}

// HACK: https://github.com/dominictarr/mux-demux/issues/34
function patchWriteStream(writeable) {
  let proxy = new PassThrough();
  proxy.on("data", writeable.write.bind(writeable));
  return proxy;
}