from snd import *
M=Mix(15.0)
M.m(0,pad([65,69,72,76],3.6),0.12)
intro(M,3.4,root=43.65)
for i in range(6): M.x(0.3+i*0.5,chime([96+(i%3)*2],g=0.05),1.0,pan=(-0.5+0.2*i))
roots=[53,50,46,48,53,48]
for i in range(6):
    a=3.4+i*0.6
    M.m(a,kick(),0.9); M.sidechain(a); M.m(a,bass(hz(roots[i]-12),0.55),0.3)
    M.m(a,clap(),0.25); M.x(a,whoosh(0.25),0.2); M.x(a,blip(77+i*2,0.18))
    M.m(a+0.3,hat(),1.0)
t=T(0.35); M.x(7.0,lp(rng.standard_normal(len(t)),0.05+0.4*(t/0.35))*(t/0.35)**2,0.7)
imp=7.25+0.1+0.9/2.75
M.x(imp,boom(),0.9); M.x(imp,clink(1.0)); M.x(imp+0.32,clink(0.45)); M.x(imp+0.49,clink(0.25))
groove(M,imp,15.0,prog='F')
M.x(10.55,whoosh(0.6),0.5); M.x(11.0,thud(),0.7); M.x(12.0,chime([77,81,84,89],gap=0.1,g=0.2))
M.write('soon.wav',fade=1.4)
