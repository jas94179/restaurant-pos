import sys, asyncio
from playwright.async_api import async_playwright
FPS = 30
async def main(times, outdir):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1080,'height':1920})
        await pg.goto('file://' + sys.argv[1])
        await pg.wait_for_timeout(500)
        for i, t in times:
            await pg.evaluate(f'render({t})')
            await pg.screenshot(path=f'{outdir}/f{i:04d}.png')
        await b.close()
mode = sys.argv[2]
if mode == 'test':
    ts = [(k, t) for k, t in enumerate([1.0, 2.5, 5.0, 7.8, 9.0, 10.2, 13.0, 17.9, 20.5])]
    asyncio.run(main(ts, 'test'))
else:
    n = int(22 * FPS)
    asyncio.run(main([(i, i / FPS) for i in range(n)], 'frames'))
