import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../src/pages/HomePage';
import { CreditsPage } from '../src/pages/CreditsPage';
import { CROPS_DATA } from '../src/data/crops';
import { SOILS_DATA } from '../src/data/soils';
import { cropImage, soilImage, allImageCredits } from '../src/data/media';
import { sowingSeason } from '../src/data/seasons';
import { selectLanguage, currentLanguage } from '../src/i18n';
import { LogoMark, Wordmark } from '../src/components/Logo';

afterEach(async () => { cleanup(); await selectLanguage('en'); localStorage.clear(); });

describe('crop and soil photos', () => {
  it('every crop and soil has a credited local photo', () => {
    for (const crop of CROPS_DATA) expect(cropImage(crop.slug)).toMatchObject({ src: `/images/crops/${crop.slug}.webp` });
    for (const soil of SOILS_DATA) expect(soilImage(soil.slug)).toMatchObject({ src: `/images/soils/${soil.slug}.webp` });
    for (const credit of allImageCredits) {
      expect(credit.author).toBeTruthy();
      expect(credit.license).toBeTruthy();
      expect(credit.source).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    }
  });
});

describe('season guide', () => {
  it.each([
    [new Date(2026, 6, 10), 'Kharif'], [new Date(2026, 10, 25), 'Rabi'],
    [new Date(2026, 0, 5), 'Rabi'], [new Date(2026, 3, 1), 'Zaid'],
  ] as const)('%s is %s sowing season', (date, season) => {
    expect(sowingSeason(date)).toBe(season);
  });
});

describe('home page', () => {
  it('lists this season’s crops with photos and switches language from the hero', async () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    const season = sowingSeason();
    const expected = CROPS_DATA.filter((crop) => crop.seasons.includes(season));
    for (const crop of expected) expect(screen.getByRole('img', { name: `${crop.name} crop` })).toHaveAttribute('src', `/images/crops/${crop.slug}.webp`);

    fireEvent.click(screen.getByRole('button', { name: 'ਪੰਜਾਬੀ' }));
    await waitFor(() => expect(currentLanguage()).toBe('pa'));
    expect(screen.getByRole('button', { name: 'ਪੰਜਾਬੀ' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ਹਰ ਮੌਸਮ ਵਿੱਚ ਆਪਣੇ ਖੇਤ ਲਈ ਬਿਹਤਰ ਫ਼ੈਸਲੇ।');
  });

  it('offers exactly the five farmer languages', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    const group = screen.getByRole('group', { name: 'Choose your language' });
    expect(Array.from(group.querySelectorAll('button')).map((b) => b.textContent)).toEqual(['English', 'हिन्दी', 'ਪੰਜਾਬੀ', 'తెలుగు', 'தமிழ்']);
  });
});

describe('photo credits page', () => {
  it('credits every photo with author, licence and source', () => {
    render(<MemoryRouter><CreditsPage /></MemoryRouter>);
    expect(screen.getAllByRole('listitem')).toHaveLength(allImageCredits.length);
    expect(screen.getAllByRole('link', { name: 'View source' })).toHaveLength(allImageCredits.length);
  });
});

describe('landing hero and logo', () => {
  it('opens with the sunrise paddy photograph, credited', () => {
    const { container } = render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(container.querySelector('img[src="/images/scenes/sunrise-paddy.webp"]')).not.toBeNull();
    expect(allImageCredits.find((credit) => credit.key === 'scenes/sunrise-paddy')).toMatchObject({
      license: 'CC0', source: expect.stringContaining('commons.wikimedia.org'),
    });
  });

  it('gives every logo instance its own gradient ids so two logos on a page do not clash', () => {
    const { container } = render(<><LogoMark /><LogoMark size={46} /></>);
    const ids = Array.from(container.querySelectorAll('linearGradient, radialGradient, clipPath')).map((node) => node.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(2);
  });

  it('reads ProFarm as a single word', () => {
    const { container } = render(<Wordmark />);
    expect(container).toHaveTextContent(/^ProFarm$/);
  });
});
