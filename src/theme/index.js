import React, { useEffect } from 'react'
import { ThemeProvider as StyledComponentsThemeProvider, createGlobalStyle, css } from 'styled-components'
import { getQueryParam, checkSupportedTheme } from '../utils'
import { SUPPORTED_THEMES } from '../constants'
import { useDarkModeManager } from '../contexts/LocalStorage'
import { Text } from 'rebass'

export * from './components'

const MEDIA_WIDTHS = {
  upToSmall: 600,
  upToMedium: 960,
  upToLarge: 1280
}

const mediaWidthTemplates = Object.keys(MEDIA_WIDTHS).reduce((accumulator, size) => {
  accumulator[size] = (...args) => css`
    @media (max-width: ${MEDIA_WIDTHS[size]}px) {
      ${css(...args)}
    }
  `
  return accumulator
}, {})

const white = '#FFFFFF'
const black = '#000000'

export default function ThemeProvider({ children }) {
  const [darkMode, toggleDarkMode] = useDarkModeManager()
  const themeURL = checkSupportedTheme(getQueryParam(window.location, 'theme'))
  const themeToRender = themeURL
    ? themeURL.toUpperCase() === SUPPORTED_THEMES.DARK
      ? true
      : themeURL.toUpperCase() === SUPPORTED_THEMES.LIGHT
      ? false
      : darkMode
    : darkMode
  useEffect(() => {
    toggleDarkMode(themeToRender)
  }, [toggleDarkMode, themeToRender])
  return <StyledComponentsThemeProvider theme={theme(themeToRender)}>{children}</StyledComponentsThemeProvider>
}

const theme = darkMode => ({
  white,
  black,
  textColor: darkMode ? white : '#010101',
  greyText: darkMode ? white : '#6C7284',
  fadedText: darkMode ? white : '#C3C5CB',

  panelBackground: darkMode ? '#292C2F' : '#FFFFFF',

  // for setting css on <html>
  backgroundColor: darkMode ? '#333639' : '#F7F8FA',
  modalBackground: darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.5)',
  inputBackground: darkMode ? '#202124' : white,
  placeholderGray: darkMode ? '#5F5F5F' : '#E1E1E1',
  shadowColor: darkMode ? '#000' : '#2F80ED',

  buttonBackgroundPlain: darkMode ? '#333639' : white,
  buttonOutlinePlain: darkMode ? '#292C2F' : white,

  // grays
  concreteGray: darkMode ? '#292C2F' : '#FAFAFA',
  mercuryGray: darkMode ? '#333333' : '#E1E1E1',
  silverGray: darkMode ? '#737373' : '#C4C4C4',
  chaliceGray: darkMode ? '#7B7B7B' : '#AEAEAE',
  doveGray: darkMode ? '#C4C4C4' : '#737373',
  mineshaftGray: darkMode ? '#E1E1E1' : '#2B2B2B',
  activeGray: darkMode ? '#292C2F' : '#F7F8FA',
  buttonOutlineGrey: darkMode ? '#FAFAFA' : '#F2F2F2',
  tokenRowHover: darkMode ? '#404040' : '#F2F2F2',

  outlineGrey: darkMode ? '#292C2F' : '#EDEEF2',
  darkGrey: darkMode ? '#888D9B' : '#888D9B',

  //blacks
  charcoalBlack: darkMode ? '#F2F2F2' : '#404040',
  // blues
  zumthorBlue: darkMode ? '#212529' : '#EBF4FF',
  malibuBlue: darkMode ? '#E67AEF' : '#5CA2FF',
  royalBlue: darkMode ? '#DC6BE5' : '#2F80ED',
  disabledBlue: darkMode ? '#2172E5' : '#2172E5',
  loadingBlue: darkMode ? '#e4f0ff' : '#e4f0ff',

  // purples
  wisteriaPurple: '#DC6BE5',
  // reds
  salmonRed: '#FF6871',
  // orange
  pizazzOrange: '#FF8F05',
  // yellows
  warningYellow: '#FFE270',
  // pink
  uniswapPink: '#DC6BE5',
  //green
  connectedGreen: '#27AE60',

  //branded
  metaMaskOrange: '#E8831D',

  //specific
  textHover: darkMode ? theme.uniswapPink : theme.doveGray,

  // connect button when loggedout
  buttonFaded: darkMode ? '#DC6BE5' : '#737373',

  // media queries
  mediaWidth: mediaWidthTemplates,
  // css snippets
  flexColumnNoWrap: css`
    display: flex;
    flex-flow: column nowrap;
  `,
  flexRowNoWrap: css`
    display: flex;
    flex-flow: row nowrap;
  `
})

export const TYPE = {
  main: ({ children, ...rest }) => (
    <Text fontWeight={500} color={theme().mineshaftGray} {...rest}>
      {children}
    </Text>
  ),
  blue: ({ children, ...rest }) => (
    <Text fontWeight={500} color={theme().royalBlue} {...rest}>
      {children}
    </Text>
  ),
  gray: ({ children, ...rest }) => (
    <Text fontWeight={500} color={theme().outlineGrey} {...rest}>
      {children}
    </Text>
  ),
  italic: ({ children, ...rest }) => (
    <Text fontWeight={500} fontSize={12} fontStyle={'italic'} color={theme().mineshaftGray} {...rest}>
      {children}
    </Text>
  ),
  error: ({ children, error, ...rest }) => (
    <Text fontWeight={500} color={error ? theme().salmonRed : theme().mineshaftGray} {...rest}>
      {children}
    </Text>
  )
}

export const GlobalStyle = createGlobalStyle`
  @import url('https://rsms.me/inter/inter.css');
  html { font-family: 'Inter', sans-serif; }
  @supports (font-variation-settings: normal) {
    html { font-family: 'Inter var', sans-serif; }
  }
  
  html,
  body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;    
  }

  body > div {
    height: 100%;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
}

  html {
    font-size: 16px;
    font-variant: none;
    color: ${({ theme }) => theme.textColor};
    background-color: ${({ theme }) => theme.backgroundColor};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }
`
