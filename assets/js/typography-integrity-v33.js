/* TYPOGRAPHY-INTEGRITY-V33-20260917
   Protect short hyphenated visible terms from breaking at their internal hyphens.
   Source text and SEO semantics remain unchanged; only rendered line breaking is constrained. */
(function(){
  'use strict';

  function eligibleTextNode(node){
    if(!node || !node.nodeValue || !node.nodeValue.includes('-')) return false;
    var parent=node.parentElement;
    if(!parent) return false;
    if(parent.closest('script,style,noscript,pre,code,textarea,[contenteditable="true"],.bn-term-lock')) return false;
    return true;
  }

  function protect(root){
    var walker=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT);
    var nodes=[];
    while(walker.nextNode()) if(eligibleTextNode(walker.currentNode)) nodes.push(walker.currentNode);

    /* Short lexical compounds only. This covers C-Level-Events, Executive-Porträt,
       15-minütiges etc. without turning long sentences or URLs into nowrap blocks. */
    var re=/\b([\p{L}\p{N}]{1,18}(?:-[\p{L}\p{N}]{1,18}){1,3})\b/gu;

    nodes.forEach(function(node){
      var text=node.nodeValue;
      var last=0;
      var changed=false;
      var frag=document.createDocumentFragment();
      var match;
      re.lastIndex=0;
      while((match=re.exec(text))){
        if(match[0].length>28) continue;
        changed=true;
        if(match.index>last) frag.appendChild(document.createTextNode(text.slice(last,match.index)));
        var span=document.createElement('span');
        span.className='bn-term-lock';
        span.textContent=match[0];
        frag.appendChild(span);
        last=match.index+match[0].length;
      }
      if(!changed) return;
      if(last<text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag,node);
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){protect(document.body);},{once:true});
  else protect(document.body);
})();
