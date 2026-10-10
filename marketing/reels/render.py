import sys, asyncio, os
from playwright.async_api import async_playwright
FPS = 30
async def main(html, times, outdir):
    os.makedirs(outdir, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1080,'height':1920})
        await pg.goto('file://' + os.path.abspath(html))
        await pg.wait_for_timeout(500)
        for i, t in times:
            await pg.evaluate(f'render({t})')
            await pg.screenshot(path=f'{outdir}/f{i:04d}.png')
        await b.close()
html, mode = sys.argv[1], sys.argv[2]
name = os.path.splitext(os.path.basename(html))[0]
if mode == 'test':
    ts = [float(x) for x in sys.argv[3].split(',')]
    asyncio.run(main(html, list(enumerate(ts)), f'test_{name}'))
    from PIL import Image
    ims=[Image.open(f'test_{name}/f{i:04d}.png').resize((270,480)) for i in range(len(ts))]
    cols=min(5,len(ims)); rows=(len(ims)+cols-1)//cols
    c=Image.new('RGB',(270*cols,480*rows))
    for i,im in enumerate(ims): c.paste(im,((i%cols)*270,(i//cols)*480))
    c.save(f'contact_{name}.png')
else:
    dur = float(sys.argv[3])
    import shutil; shutil.rmtree(f'frames_{name}', ignore_errors=True)
    asyncio.run(main(html, [(i, i / FPS) for i in range(int(dur * FPS))], f'frames_{name}'))
