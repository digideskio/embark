import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import qs from 'qs';
import {withRouter} from 'react-router-dom';
import TransactionDecoder from '../components/TransactionDecoder';
import PageHead from '../components/PageHead';
import { Row, Col } from 'reactstrap';
import { transaction as transactionAction } from '../actions';
import {getTransaction} from "../reducers/selectors";

const getQueryParams = (props) => {
  return qs.parse(props.location.search, {
    ignoreQueryPrefix: true
  });
};

class TransactionDecoderContainer extends Component {
  componentDidMount() {
    const { hash, isRawTxHash } = getQueryParams(this.props);
    if (hash) {
      this.props.fetchTransaction(hash, isRawTxHash);
    }
  }

  componentDidUpdate(prevProps) {
    const { hash, isRawTxHash } = getQueryParams(this.props);
    const prevHash = getQueryParams(prevProps).hash;
    const prevIsRawTxHash = getQueryParams(prevProps).isRawTxHash;

    if (hash && (hash !== prevHash || isRawTxHash !== prevIsRawTxHash)) {
      this.props.fetchTransaction(hash, isRawTxHash);
    }
  }

  render() {
    return (
      <React.Fragment>
        <PageHead title="Transaction Decoder" description="Decode values encoded in a transaction" />
        <Row>
          <Col>
            <TransactionDecoder transaction={this.props.transaction}
                                transactionHash={getQueryParams(this.props).hash}/>
          </Col>
        </Row>
      </React.Fragment>
    );
  }
}

TransactionDecoderContainer.propTypes = {
  fetchTransaction: PropTypes.func,
  transaction: PropTypes.object
};

function mapStateToProps(state, props) {
  return {
    transaction: getTransaction(state, getQueryParams(props).hash, getQueryParams(props).isRawTxHash),
    error: state.errorMessage,
    loading: state.loading
  };
}
export default withRouter(connect(
  mapStateToProps,
  {
    fetchTransaction: transactionAction.request
  }
)(TransactionDecoderContainer));
