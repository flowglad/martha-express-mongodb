import { observer } from 'mobx-react';
import Head from 'next/head';

import * as React from 'react';
import { useEffect, useState } from 'react';

import Button from '@mui/material/Button';

import Layout from '../components/layout';
import notify from '../lib/notify';
import { Store } from '../lib/store';
import withAuth from '../lib/withAuth';

type Props = {
  store: Store;
  isMobile: boolean;
  firstGridItem: boolean;
  teamRequired: boolean;
  teamSlug: string;
  redirectMessage?: string;
};

function Billing({
  store,
  isMobile,
  firstGridItem,
  teamRequired,
  teamSlug,
  redirectMessage,
}: Props) {
  const [disabled] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);

  useEffect(() => {
    if (redirectMessage) {
      notify(redirectMessage);
    }
  }, [redirectMessage]);

  const { currentTeam, currentUser } = store;
  const isTeamLeader = currentTeam && currentUser && currentUser._id === currentTeam.teamLeaderId;

  if (!currentTeam || currentTeam.slug !== teamSlug) {
    return (
      <Layout
        store={store}
        isMobile={isMobile}
        teamRequired={teamRequired}
        firstGridItem={firstGridItem}
      >
        <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
          <p>You did not select any team.</p>
          <p>
            To access this page, please select existing team or create new team if you have no teams.
          </p>
        </div>
      </Layout>
    );
  }

  if (!isTeamLeader) {
    return (
      <Layout
        store={store}
        isMobile={isMobile}
        teamRequired={teamRequired}
        firstGridItem={firstGridItem}
      >
        <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
          <p>Only the Team Leader can access this page.</p>
          <p>Create your own team to become a Team Leader.</p>
        </div>
      </Layout>
    );
  }

  const handleCheckoutClick = (_mode: 'subscription' | 'setup') => {
    notify('Billing integration pending. This feature will be available once billing is configured.');
  };

  const showListOfInvoicesOnClick = () => {
    notify('Billing integration pending. This feature will be available once billing is configured.');
    setShowInvoices(true);
  };

  const renderSubscriptionButton = () => {
    // Placeholder state: always show as "not a paying customer"
    return (
      <React.Fragment>
        <p>You are not a paying customer.</p>
        <p>
          Buy subscription to enable team features. Billing integration is pending configuration.
        </p>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleCheckoutClick('subscription')}
          disabled={disabled}
        >
          Buy subscription
        </Button>
      </React.Fragment>
    );
  };

  const renderCardInfo = () => {
    // Placeholder state: no card information
    return (
      <span>
        <p>You have not added a card.</p>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => handleCheckoutClick('setup')}
          disabled={disabled}
        >
          Add card
        </Button>
      </span>
    );
  };

  const renderInvoices = () => {
    if (!showInvoices) {
      return null;
    }

    return (
      <React.Fragment>
        <p style={{ marginTop: '20px', color: '#666' }}>
          Payment history will appear here once billing is configured.
        </p>
      </React.Fragment>
    );
  };

  return (
    <Layout
      store={store}
      isMobile={isMobile}
      teamRequired={teamRequired}
      firstGridItem={firstGridItem}
    >
      <Head>
        <title>Your Billing</title>
      </Head>
      <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
        <h3>Your Billing</h3>
        <p />
        <h4 style={{ marginTop: '40px' }}>Paid plan</h4>
        {renderSubscriptionButton()}
        <p />
        <br />
        <h4>Card information</h4>
        {renderCardInfo()}
        <p />
        <br />
        <h4>Payment history</h4>
        <Button
          variant="outlined"
          color="primary"
          onClick={showListOfInvoicesOnClick}
          disabled={disabled}
        >
          Show payment history
        </Button>
        <p />
        {renderInvoices()}
        <p />
        <br />
      </div>
    </Layout>
  );
}

export default withAuth(observer(Billing));
