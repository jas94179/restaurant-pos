import numpy as np, wave
SR=44100; DUR=25.0; N=int(SR*DUR)
rng=np.random.default_rng(7)
music=np.zeros((N,2)); sfx=np.zeros((N,2))
def T(d): return np.arange(int(SR*d))/SR
def put(buf,t0,sig,gain=1.0,pan=0.0):
    i=int(t0*SR); 
    if i>=N: return
    sig=sig[:N-i]*gain
    buf[i:i+len(sig),0]+=sig*np.sqrt((1-pan)/2)*1.414
    buf[i:i+len(sig),1]+=sig*np.sqrt((1+pan)/2)*1.414
def lp(x,a):  # one-pole low-pass, a in (0,1]
    a=np.broadcast_to(np.asarray(a,float),x.shape)
    y=np.empty_like(x); s=0.0
    for i in range(len(x)): s+=a[i]*(x[i]-s); y[i]=s
    return y
def hz(n): return 440*2**((n-69)/12)
# --- instruments
def kick():
    t=T(0.35); f=45+90*np.exp(-t*30); ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-t*9)
def clap():
    t=T(0.22); n=rng.standard_normal(len(t))
    env=np.exp(-t*25)+0.6*np.exp(-np.maximum(t-0.012,0)*40)*(t>0.012)
    return np.diff(np.r_[0,n])*env*0.5
def hat():
    t=T(0.06); n=rng.standard_normal(len(t)); return np.diff(np.r_[0,np.diff(np.r_[0,n])])*np.exp(-t*80)*0.15
def pluck(f,d=0.45):
    t=T(d); s=sum(np.sin(2*np.pi*f*k*t)/k**1.3 for k in (1,2,3,4))
    return s*np.exp(-t*7)*np.minimum(1,t*400)
def pad(notes,d):
    t=T(d); s=np.zeros(len(t))
    for n in notes:
        for det in (-0.12,0.12): s+=np.sin(2*np.pi*hz(n+det)*t)+0.3*np.sin(2*np.pi*hz(n+det)*2*t)
    env=np.minimum(1,t/0.25)*np.minimum(1,(d-t)/0.3)
    return s*env/len(notes)
def bass(f,d):
    t=T(d); s=np.sin(2*np.pi*f*t)+0.35*np.sin(2*np.pi*2*f*t)+0.15*np.sin(2*np.pi*3*f*t)
    return s*np.exp(-t*4)*np.minimum(1,t*300)
# --- music: F maj7, Dm7, Bbmaj7, C  (120 bpm, bar = 2s), starts 2.2s
CH=[(53,[65,69,72,76]),(50,[62,65,69,72]),(46,[58,62,65,69]),(48,[60,64,67,72])]
START=2.2; BEAT=0.5; END_DRUMS=20.8; END=25.0
duck=np.ones(N)
bar=0
while START+bar*2<END:
    t0=START+bar*2; root,notes=CH[bar%4]
    put(music,t0,pad(notes,2.0),0.10)
    for e in range(8):
        te=t0+e*0.25
        if te>=END: break
        put(music,te,bass(hz(root-12+(12 if e%4==3 else 0)),0.25),0.22)
        put(music,te,pluck(hz(notes[[0,2,1,3,2,1,3,2][e]]+12)),0.07,pan=(-0.4 if e%2 else 0.4))
    for b in range(4):
        tb=t0+b*BEAT
        if tb<END_DRUMS:
            put(music,tb,kick(),0.75)
            i=int(tb*SR); L=int(0.22*SR); duck[i:i+L]=np.minimum(duck[i:i+L],0.45+0.55*np.linspace(0,1,min(L,N-i)))
            if b%2==1: put(music,tb,clap(),0.35)
            put(music,tb+0.25,hat(),1.0,pan=0.3)
            put(music,tb+0.125,hat(),0.5,pan=-0.3); put(music,tb+0.375,hat(),0.5,pan=-0.3)
    bar+=1
music*=duck[:,None]
# hook: low drone + riser
t=T(START); drone=(np.sin(2*np.pi*43.65*t)+0.5*np.sin(2*np.pi*87.3*t))*np.minimum(1,t/0.3)
put(music,0,drone,0.18)
n=rng.standard_normal(len(t)); riser=lp(n,0.02+0.25*(t/START)**2)*(t/START)**2
put(music,0,riser,0.9)
# fade out end
fo=np.clip((END-np.arange(N)/SR)/1.6,0,1); music*=fo[:,None]
# --- sfx
def whoosh(d=0.5,up=True):
    t=T(d); n=rng.standard_normal(len(t)); x=t/d
    a=0.03+0.35*(x if up else 1-x)
    y=np.empty_like(n); s=0.0
    for i in range(len(n)): s+=a[i]*(n[i]-s); y[i]=s
    return y*np.sin(np.pi*x)**2*1.6
def clink(g=1.0):
    t=T(0.5); s=sum(a*np.sin(2*np.pi*f*t)*np.exp(-t*dk) for f,a,dk in ((2350,1,9),(3520,.6,12),(5120,.4,16),(6900,.25,22)))
    return s*g*0.35
def thud():
    t=T(0.3); return np.sin(2*np.pi*(55+60*np.exp(-t*25))*t)*np.exp(-t*12)
def tap():
    t=T(0.05); return (np.sin(2*np.pi*1800*t)*0.6+rng.standard_normal(len(t))*0.25)*np.exp(-t*120)
def chime(notes,gap=0.09,g=0.25):
    out=np.zeros(int(SR*(gap*len(notes)+0.9)))
    for k,nn in enumerate(notes):
        t=T(0.9); s=(np.sin(2*np.pi*hz(nn)*t)+0.3*np.sin(2*np.pi*hz(nn)*3*t))*np.exp(-t*5)
        i=int(k*gap*SR); out[i:i+len(s)]+=s
    return out*g
def printer(d):
    t=T(d); buzz=np.sign(np.sin(2*np.pi*190*t))*0.3+np.sin(2*np.pi*380*t)*0.2
    am=0.55+0.45*np.sign(np.sin(2*np.pi*22*t))
    noise=lp(rng.standard_normal(len(t)),0.3)*0.3
    env=np.minimum(1,t/0.05)*np.minimum(1,(d-t)/0.05)
    return lp((buzz*am+noise)*env,0.25)
def register():
    t=T(1.2); bell=sum(a*np.sin(2*np.pi*f*t)*np.exp(-t*dk) for f,a,dk in ((1975,1,3),(2960,.5,4),(3950,.35,6),(5270,.2,8)))
    ka=np.zeros(len(t)); k=lp(rng.standard_normal(int(0.08*SR)),0.5)*np.exp(-np.arange(int(0.08*SR))/SR*50); ka[:len(k)]=k
    return np.r_[ka[:int(0.09*SR)]*0.8, bell[:len(t)-int(0.09*SR)]*0.3]
put(sfx,0.32,thud(),0.6); put(sfx,0.38,tap(),0.5)
put(sfx,1.0,thud(),0.5)
for at in (2.2,5.2,13.2,17.2,20.8): put(sfx,at-0.05,whoosh(0.6),0.5)
for at,g in ((2.9,1.0),(3.3,0.45),(3.5,0.25)): put(sfx,at,clink(g),1.0)
for at in (6.4,7.05,7.8,9.8): put(sfx,at,tap(),0.7,pan=0.1)
put(sfx,8.7,whoosh(0.4),0.25); put(sfx,10.4,whoosh(0.35),0.2)
put(sfx,11.7,chime([84,88,91,96]),1.0)
put(sfx,12.0,chime([91],g=0.12),1.0)
put(sfx,14.1,printer(2.3),0.35)
# count-up ticks (out-cubic progress over 18.2..19.6)
vals=np.linspace(0,1,22)[1:-1]; 
for v in vals:
    p=1-(1-v)**(1/3); put(sfx,18.2+1.4*(1-(1-v)**(1/3)) if False else 18.2+1.4*(1-(1-v)**(1/3)),tap(),0.25)
put(sfx,19.7,register(),1.0)
put(sfx,21.7,chime([77,81,84],gap=0.12,g=0.18),1.0)
mix=music*0.8+sfx*0.9
mix/=np.max(np.abs(mix))*1.12
mix=np.tanh(mix*1.3)/np.tanh(1.3)*0.9
w=wave.open('sound.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix*32767).astype('<i2').tobytes()); w.close()
print('ok')
