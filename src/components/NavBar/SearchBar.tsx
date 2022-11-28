// eslint-disable-next-line no-restricted-imports
import { t } from '@lingui/macro'
import { sendAnalyticsEvent, Trace, TraceEvent, useTrace } from '@uniswap/analytics'
import { BrowserEvent, ElementName, EventName, SectionName } from '@uniswap/analytics-events'
import clsx from 'clsx'
import { NftVariant, useNftFlag } from 'featureFlags/flags/nft'
import useDebounce from 'hooks/useDebounce'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { organizeSearchResults } from 'lib/utils/searchBar'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { magicalGradientOnHover } from 'nft/css/common.css'
import { useIsMobile, useIsTablet } from 'nft/hooks'
import { fetchSearchCollections } from 'nft/queries'
import { fetchSearchTokens } from 'nft/queries/genie/SearchTokensFetcher'
import { ChangeEvent, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useQuery } from 'react-query'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components/macro'

import { ChevronLeftIcon, MagnifyingGlassIcon, NavMagnifyingGlassIcon } from '../../nft/components/icons'
import { NavIcon } from './NavIcon'
import * as styles from './SearchBar.css'
import { SearchBarDropdown } from './SearchBarDropdown'

const KeyShortCut = styled.div`
  background-color: ${({ theme }) => theme.searchOutline};
  color: ${({ theme }) => theme.textSecondary};
  padding: 0px 8px;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 800;
  line-height: 16px;
  display: flex;
  align-items: center;
  opacity: 0.6;
  backdrop-filter: blur(60px);
`

export const SearchBar = () => {
  const [isOpen, toggleOpen] = useReducer((state: boolean) => !state, false)
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearchValue = useDebounce(searchValue, 300)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { pathname } = useLocation()
  const phase1Flag = useNftFlag()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isPhase1 = phase1Flag === NftVariant.Enabled

  useOnClickOutside(searchRef, () => {
    isOpen && toggleOpen()
  })

  const { data: collections, isLoading: collectionsAreLoading } = useQuery(
    ['searchCollections', debouncedSearchValue],
    () => fetchSearchCollections(debouncedSearchValue),
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      enabled: !!debouncedSearchValue.length && isPhase1,
    }
  )

  const { data: tokens, isLoading: tokensAreLoading } = useQuery(
    ['searchTokens', debouncedSearchValue],
    () => fetchSearchTokens(debouncedSearchValue),
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      enabled: !!debouncedSearchValue.length,
    }
  )

  const isNFTPage = useIsNftPage()

  const [reducedTokens, reducedCollections] = organizeSearchResults(isNFTPage, tokens ?? [], collections ?? [])

  // close dropdown on escape
  useEffect(() => {
    const escapeKeyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        toggleOpen()
      }
    }

    document.addEventListener('keydown', escapeKeyDownHandler)

    return () => {
      document.removeEventListener('keydown', escapeKeyDownHandler)
    }
  }, [isOpen, toggleOpen, collections])

  // clear searchbar when changing pages
  useEffect(() => {
    setSearchValue('')
  }, [pathname])

  // auto set cursor when searchbar is opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const isMobileOrTablet = isMobile || isTablet
  const showCenteredSearchContent =
    !isOpen && phase1Flag !== NftVariant.Enabled && !isMobileOrTablet && searchValue.length === 0

  const trace = useTrace({ section: SectionName.NAVBAR_SEARCH })

  const navbarSearchEventProperties = {
    navbar_search_input_text: debouncedSearchValue,
    hasInput: debouncedSearchValue && debouncedSearchValue.length > 0,
    ...trace,
  }
  const placeholderText = useMemo(() => {
    return phase1Flag === NftVariant.Enabled
      ? isMobileOrTablet
        ? t`Search`
        : t`Search tokens and NFT collections`
      : t`Search tokens`
  }, [phase1Flag, isMobileOrTablet])

  const handleKeyPress = useCallback(
    (event: any) => {
      if (event.key === '/') {
        event.preventDefault()
        !isOpen && toggleOpen()
      }
    },
    [isOpen]
  )

  useEffect(() => {
    const innerRef = inputRef.current

    if (innerRef !== null) {
      //only mount the listener when input available as ref
      document.addEventListener('keydown', handleKeyPress)
    }

    return () => {
      if (innerRef !== null) {
        document.removeEventListener('keydown', handleKeyPress)
      }
    }
  }, [handleKeyPress, inputRef])

  return (
    <Trace section={SectionName.NAVBAR_SEARCH}>
      <Box
        position={{ sm: 'fixed', md: 'absolute', xl: 'relative' }}
        width={{ sm: isOpen ? 'viewWidth' : 'auto', md: 'auto' }}
        ref={searchRef}
        className={isPhase1 ? styles.searchBarContainerNft : styles.searchBarContainer}
        display={{ sm: isOpen ? 'inline-block' : 'none', xl: 'inline-block' }}
      >
        <Row
          className={clsx(
            ` ${isPhase1 ? styles.nftSearchBar : styles.searchBar} ${!isOpen && !isMobile && magicalGradientOnHover} ${
              isMobileOrTablet && (isOpen ? styles.visible : styles.hidden)
            } `
          )}
          borderRadius={isOpen || isMobileOrTablet ? undefined : '12'}
          borderTopRightRadius={isOpen && !isMobile ? '12' : undefined}
          borderTopLeftRadius={isOpen && !isMobile ? '12' : undefined}
          borderBottomWidth={isOpen || isMobileOrTablet ? '0px' : '1px'}
          backgroundColor={isOpen ? 'backgroundSurface' : 'searchBackground'}
          onClick={() => !isOpen && toggleOpen()}
          gap="12"
        >
          <Box className={showCenteredSearchContent ? styles.searchContentCentered : styles.searchContentLeftAlign}>
            <Box display={{ sm: 'none', md: 'flex' }}>
              <MagnifyingGlassIcon />
            </Box>
            <Box display={{ sm: 'flex', md: 'none' }} color="textTertiary" onClick={toggleOpen}>
              <ChevronLeftIcon />
            </Box>
          </Box>
          <TraceEvent
            events={[BrowserEvent.onFocus]}
            name={EventName.NAVBAR_SEARCH_SELECTED}
            element={ElementName.NAVBAR_SEARCH_INPUT}
            properties={{ ...trace }}
          >
            <Box
              as="input"
              placeholder={placeholderText}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                !isOpen && toggleOpen()
                setSearchValue(event.target.value)
              }}
              onBlur={() => sendAnalyticsEvent(EventName.NAVBAR_SEARCH_EXITED, navbarSearchEventProperties)}
              className={`${styles.searchBarInput} ${
                showCenteredSearchContent ? styles.searchContentCentered : styles.searchContentLeftAlign
              }`}
              value={searchValue}
              ref={inputRef}
              width={phase1Flag === NftVariant.Enabled || isOpen ? 'full' : '160'}
            />
          </TraceEvent>
          {!isOpen && isPhase1 && <KeyShortCut>/</KeyShortCut>}
        </Row>
        <Box className={clsx(isOpen ? styles.visible : styles.hidden)}>
          {isOpen && (
            <SearchBarDropdown
              toggleOpen={toggleOpen}
              tokens={reducedTokens}
              collections={reducedCollections}
              queryText={debouncedSearchValue}
              hasInput={debouncedSearchValue.length > 0}
              isLoading={tokensAreLoading || (collectionsAreLoading && phase1Flag === NftVariant.Enabled)}
            />
          )}
        </Box>
      </Box>
      {isMobileOrTablet && (
        <NavIcon onClick={toggleOpen}>
          <NavMagnifyingGlassIcon />
        </NavIcon>
      )}
    </Trace>
  )
}
