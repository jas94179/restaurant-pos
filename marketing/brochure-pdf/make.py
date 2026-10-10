import asyncio, os
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':794,'height':1123}, device_scale_factor=2)
        await pg.goto('file://' + os.path.abspath('brochure.html')); await pg.wait_for_timeout(400)
        await pg.pdf(path='galla-brochure.pdf', format='A4', print_background=True, margin={'top':'0','bottom':'0','left':'0','right':'0'})
        for i in range(4):
            await pg.screenshot(path=f'p{i+1}.png', clip={'x':0,'y':1123*i,'width':794,'height':1123}, full_page=True)
        await b.close()
asyncio.run(main())
