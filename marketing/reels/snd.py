import numpy as np, wave
SR=44100
rng=np.random.default_rng(7)
def T(d): return np.arange(int(SR*d))/SR
def hz(n): return 440*2**((n-69)/12)
def lp(x,a):
    a=np.broadcast_to(np.asarray(a,float),x.shape); y=np.empty_like(x); s=0.0
    for i in range(len(x)): s+=a[i]*(x[i]-s); y[i]=s
    return y
class Mix:
    def __init__(s,dur): s.dur=dur; s.N=int(SR*dur); s.music=np.zeros((s.N,2)); s.sfx=np.zeros((s.N,2)); s.duck=np.ones(s.N)
    def put(s,buf,t0,sig,gain=1.0,pan=0.0):
        b=s.music if buf=='m' else s.sfx; i=int(t0*SR)
        if i>=s.N or i<0: return
        sig=sig[:s.N-i]*gain
        b[i:i+len(sig),0]+=sig*np.sqrt((1-pan)/2)*1.414; b[i:i+len(sig),1]+=sig*np.sqrt((1+pan)/2)*1.414
    def m(s,*a,**k): s.put('m',*a,**k)
    def x(s,*a,**k): s.put('x',*a,**k)
    def sidechain(s,t0):
        i=int(t0*SR); L=min(int(0.22*SR),s.N-i)
        if L>0: s.duck[i:i+L]=np.minimum(s.duck[i:i+L],0.45+0.55*np.linspace(0,1,L))
    def write(s,path,fade=1.6):
        mu=s.music*s.duck[:,None]
        fo=np.clip((s.dur-np.arange(s.N)/SR)/fade,0,1); mu*=fo[:,None]
        mix=mu*0.8+s.sfx*0.9; mix/=np.max(np.abs(mix))*1.12
        mix=np.tanh(mix*1.3)/np.tanh(1.3)*0.9
        w=wave.open(path,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix*32767).astype('<i2').tobytes()); w.close()
# instruments
def kick():
    t=T(0.35); f=45+90*np.exp(-t*30); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)
def clap():
    t=T(0.22); n=rng.standard_normal(len(t)); env=np.exp(-t*25)+0.6*np.exp(-np.maximum(t-0.012,0)*40)*(t>0.012)
    return np.diff(np.r_[0,n])*env*0.5
def hat():
    t=T(0.06); n=rng.standard_normal(len(t)); return np.diff(np.r_[0,np.diff(np.r_[0,n])])*np.exp(-t*80)*0.15
def pluck(f,d=0.45):
    t=T(d); s=sum(np.sin(2*np.pi*f*k*t)/k**1.3 for k in (1,2,3,4)); return s*np.exp(-t*7)*np.minimum(1,t*400)
def pad(notes,d):
    t=T(d); s=np.zeros(len(t))
    for n in notes:
        for det in (-0.12,0.12): s+=np.sin(2*np.pi*hz(n+det)*t)+0.3*np.sin(2*np.pi*hz(n+det)*2*t)
    return s*np.minimum(1,t/0.25)*np.minimum(1,(d-t)/0.3)/len(notes)
def bass(f,d):
    t=T(d); s=np.sin(2*np.pi*f*t)+0.35*np.sin(2*np.pi*2*f*t)+0.15*np.sin(2*np.pi*3*f*t); return s*np.exp(-t*4)*np.minimum(1,t*300)
PROGS={
 'F':[(53,[65,69,72,76]),(50,[62,65,69,72]),(46,[58,62,65,69]),(48,[60,64,67,72])],
 'G':[(43,[67,71,74,78]),(40,[64,67,71,74]),(48,[60,64,67,71]),(50,[62,66,69,74])],
 'Am':[(45,[69,72,76,79]),(41,[65,69,72,76]),(48,[67,72,76,79]),(43,[67,71,74,79])],
}
ARP=[0,2,1,3,2,1,3,2]
def groove(M,start,end,drums_end=None,prog='F',bpm=120,drums=True,arp=True,padg=0.10):
    beat=60/bpm; barlen=beat*4; drums_end=drums_end if drums_end is not None else end
    ch=PROGS[prog]; bar=0
    while start+bar*barlen<end:
        t0=start+bar*barlen; root,notes=ch[bar%4]
        M.m(t0,pad(notes,barlen),padg)
        for e in range(8):
            te=t0+e*beat/2
            if te>=end: break
            M.m(te,bass(hz(root-12+(12 if e%4==3 else 0)),beat/2),0.22)
            if arp: M.m(te,pluck(hz(notes[ARP[e]]+12)),0.07,pan=(-0.4 if e%2 else 0.4))
        for b in range(4):
            tb=t0+b*beat
            if drums and tb<drums_end:
                M.m(tb,kick(),0.75); M.sidechain(tb)
                if b%2==1: M.m(tb,clap(),0.35)
                M.m(tb+beat/2,hat(),1.0,pan=0.3); M.m(tb+beat/4,hat(),0.5,pan=-0.3); M.m(tb+3*beat/4,hat(),0.5,pan=-0.3)
        bar+=1
def intro(M,dur,root=43.65):
    t=T(dur); drone=(np.sin(2*np.pi*root*t)+0.5*np.sin(2*np.pi*root*2*t))*np.minimum(1,t/0.3); M.m(0,drone,0.18)
    n=rng.standard_normal(len(t)); M.m(0,lp(n,0.02+0.25*(t/dur)**2)*(t/dur)**2,0.9)
# sfx
def whoosh(d=0.5):
    t=T(d); x=t/d; return lp(rng.standard_normal(len(t)),0.03+0.35*x)*np.sin(np.pi*x)**2*1.6
def clink(g=1.0):
    t=T(0.5); return sum(a*np.sin(2*np.pi*f*t)*np.exp(-t*dk) for f,a,dk in ((2350,1,9),(3520,.6,12),(5120,.4,16),(6900,.25,22)))*g*0.35
def thud():
    t=T(0.3); return np.sin(2*np.pi*(55+60*np.exp(-t*25))*t)*np.exp(-t*12)
def boom():
    t=T(1.2); return np.sin(2*np.pi*np.cumsum(38+80*np.exp(-t*12))/SR)*np.exp(-t*3.5)+lp(rng.standard_normal(len(t)),0.05)*np.exp(-t*6)*0.6
def tap():
    t=T(0.05); return (np.sin(2*np.pi*1800*t)*0.6+rng.standard_normal(len(t))*0.25)*np.exp(-t*120)
def blip(n=84,g=0.2):
    t=T(0.18); return np.sin(2*np.pi*hz(n)*t)*np.exp(-t*25)*g
def chime(notes,gap=0.09,g=0.25):
    o=np.zeros(int(SR*(gap*len(notes)+0.9)))
    for k,nn in enumerate(notes):
        t=T(0.9); s=(np.sin(2*np.pi*hz(nn)*t)+0.3*np.sin(2*np.pi*hz(nn)*3*t))*np.exp(-t*5); i=int(k*gap*SR); o[i:i+len(s)]+=s
    return o*g
def error():
    return np.r_[blip(64,0.5)[:int(0.12*SR)],blip(60,0.5)]
def printer(d):
    t=T(d); buzz=np.sign(np.sin(2*np.pi*190*t))*0.3+np.sin(2*np.pi*380*t)*0.2
    am=0.55+0.45*np.sign(np.sin(2*np.pi*22*t)); noise=lp(rng.standard_normal(len(t)),0.3)*0.3
    return lp((buzz*am+noise)*np.minimum(1,t/0.05)*np.minimum(1,(d-t)/0.05),0.25)
def register():
    t=T(1.2); bell=sum(a*np.sin(2*np.pi*f*t)*np.exp(-t*dk) for f,a,dk in ((1975,1,3),(2960,.5,4),(3950,.35,6),(5270,.2,8)))
    L=int(0.08*SR); k=lp(rng.standard_normal(L),0.5)*np.exp(-np.arange(L)/SR*50)
    return np.r_[k*0.8,bell[:len(t)-L]*0.3]
def ping():  # message arrives
    return chime([88,93],gap=0.07,g=0.22)
def ticks(M,a,b,n=20,g=0.25):
    for i in range(1,n): v=i/n; M.x(a+(b-a)*(1-(1-v)**(1/3)),tap(),g)
def endsting(M,at):
    M.x(at-0.05,whoosh(0.6),0.5)
    for d,g in ((0.83,1.0),(1.15,0.45),(1.32,0.25)): M.x(at+d,clink(g))
