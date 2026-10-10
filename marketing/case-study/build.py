import re, base64
s=open('case.src.html').read()
def sub(m):
    n=m.group(1); b=base64.b64encode(open(f'img/{n}.jpg','rb').read()).decode()
    return 'data:image/jpeg;base64,'+b
s=re.sub(r'IMG:([\w-]+)', sub, s)
open('galla-case-study.html','w').write(s)
print(len(s)//1024,'KB')
