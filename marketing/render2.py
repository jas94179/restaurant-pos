import sys, asyncio
from playwright.async_api import async_playwright
FPS = 30; DUR = 25.0
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
    ts = list(enumerate([0.5, 1.6, 3.6, 6.6, 9.9, 11.0, 12.3, 15.4, 19.9, 23.5]))
    asyncio.run(main(ts, 'test'))
else:
    asyncio.run(main([(i, i / FPS) for i in range(int(DUR * FPS))], 'frames'))
