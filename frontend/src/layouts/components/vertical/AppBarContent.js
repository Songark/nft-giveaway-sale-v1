// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Slide from '@mui/material/Slide';
import Snackbar from '@mui/material/Snackbar';

import Web3 from 'web3'
import { useState, useEffect } from 'react'
// ** Icons Imports
import Menu from 'mdi-material-ui/Menu'
import Magnify from 'mdi-material-ui/Magnify'

// ** Components
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector'
import { getBlockchain } from '../../../../lib/ethereum'

const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 80001, 137],
  })
const ETH_NET = "0x01";

function TransitionLeft(props) {
  return <Slide {...props} direction="left" />;
}
const AppBarContent = props => {
  // ** Props
  const { hidden, settings, saveSettings, toggleNavVisibility } = props

  // ** Hook
  const hiddenSm = useMediaQuery(theme => theme.breakpoints.down('sm'))

  const [connectBtnName, setConnectBtnName] = useState("Connect Wallet");
  const [connectState, setConnectState] = useState(false);
  const [loginState, setLoginState] = useState();
  const {active, account, library, connector, chainId, activate, deactivate } = useWeb3React();

  useEffect(() => {
    injected.isAuthorized()
    .then((isAuthorized) => {
      if (isAuthorized && !active) {
        connectToWallet();
      }
    })
    .catch((error) => {
      console.log(error);
    })

    const initCall = async () => {
      if (!active)
        await onConnectWallet();
    }
    
    initCall();
  }, []);

  async function connectToWallet() {
    try {
      await activate(injected);
    } catch (ex) {
      console.log(ex)
    }
  }
    
  const handleClose = () => {
    setLoginState("");
  };
  const shortAddress = (address) => {
    const len = address.length;
    return address.slice(0, 6) + "..." + address.slice(len - 4, len);
  }

  const onConnectWallet = async () => {
    if(!connectState) {
      try {
        const { giftdrop, minionverseContract, roosterwarsContract, accounts } = await getBlockchain();
        settings.giftdrop = giftdrop;
        settings.MinionverseContract = minionverseContract;
        settings.RoosterwarsContract = roosterwarsContract;
        settings.accounts = accounts;
        settings.conError = "";
        
        const startId0 = 1;
        const endId0 = await minionverseContract.methods.totalSupply().call();
        const startId1 = 1;
        const endId1 = await roosterwarsContract.methods.totalSupply().call();
        if(accounts != null) {
          const shortAddr = shortAddress(accounts[0]);
          setConnectBtnName(shortAddr);
          setConnectState(true);
          setLoginState("Connected to your wallet!");
          //const giftedIds = await giftdrop.methods.getGiftedList().call();
          settings.minionverse = {startId: startId0, endId:endId0};
          settings.roosterwars = {startId: startId1, endId:endId1};
        }
      } catch(e) {
        console.log(e.message);
        setLoginState("No MetaMask wallet.... Please install it.");
      }
  
    } else {

      settings.giftdrop = null;
      settings.mogulContract = null;
      settings.investorContract = null;
      settings.accounts = null;
      settings.conError = "";
      settings.mogul = null;
      settings.investor = null;
      
      setConnectBtnName("Connect Wallet");
      setConnectState(false);
      setLoginState("Disconnected from your wallet!");
    }
    saveSettings(settings);
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box className='actions-left' sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
        {hidden ? (
          <IconButton
            color='inherit'
            onClick={toggleNavVisibility}
            sx={{ ml: -2.75, ...(hiddenSm ? {} : { mr: 3.5 }) }}
          >
            <Menu />
          </IconButton>
        ) : null}
        <TextField
          size='small'
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Magnify fontSize='small' />
              </InputAdornment>
            )
          }}
        />
      </Box>
      <Box>
        <Snackbar
          open={loginState !== undefined && loginState != "" ? true : false}
          onClose={handleClose}
          TransitionComponent={TransitionLeft}
          message={loginState}
        />
      </Box>
      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center' }}>
        <ModeToggler settings={settings} saveSettings={saveSettings} />

        <Button fullWidth variant='contained' sx={{ ml: 4 }} onClick={onConnectWallet}>
          {connectBtnName}
        </Button>
      </Box>
    </Box>
  )
}

export default AppBarContent
