import React, { Component, PropTypes } from 'react';
import { graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';

import { NewMessageForm } from '../../../components';
import { setShouldScrollToBottom } from '../../../redux/actions/messages';
import postMessageMutation from './postMessage.graphql';

@connect(
  (state) => ({
    user: state.auth.currentUser,
  })
)
@graphql(postMessageMutation, {
  props: ({ ownProps, mutate }) => ({
    postMessage: ({ content, user }) => mutate({
      variables: {
        room: ownProps.room,
        channel: ownProps.channel,
        content
      },
      optimisticResponse: {
        postMessage: {
          __typename: 'Message',
          id: '0',
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: {
            __typename: 'User',
            id: '0',
            username: user.username,
            avatarUrl: user.avatarUrl,
          },
          error: null
        }
      },
      updateQueries: {
        MessageList: (previousResult, { mutationResult }) => {
          setTimeout(() => ownProps.dispatch(setShouldScrollToBottom()), 100);

          return {
            messages: [mutationResult.data.postMessage, ...previousResult.messages]
          };
        }
      }
    }),
  }),
})
@reduxForm({
  form: 'postMessage'
})
export default class NewMessageFormContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      submitError: null,
    };
  }

  handleKeyPress(e) {
    if (e.which === 13 && !e.shiftKey) {
      const { handleSubmit, pristine, submitting } = this.props;
      e.preventDefault();
      if (!pristine && !submitting) {
        handleSubmit(this.onSubmit.bind(this))();
      }
      return false;
    }
  }

  async onSubmit({ content }) { // eslint-disable-line react/prop-types
    const { postMessage, reset, user } = this.props;
    reset();
    this.setState({ submitError: null });
    postMessage({ content, user }).catch(({ graphQLErrors }) => {
      this.setState({ submitError: graphQLErrors[0].message });
    });
  }

  render() {
    const { submitError } = this.state;
    const { channel, handleSubmit, pristine, submitting, user } = this.props;
    return (
      <NewMessageForm
        channel={channel}
        pristine={pristine}
        submitError={submitError}
        submitting={submitting}
        user={user}
        onKeyPress={this.handleKeyPress.bind(this)}
        onSubmit={handleSubmit(this.onSubmit.bind(this))}
      />
    );
  }
}

NewMessageFormContainer.propTypes = {
  channel: PropTypes.string.isRequired,
  dispatch: PropTypes.func,
  handleSubmit: PropTypes.func,
  postMessage: PropTypes.func,
  pristine: PropTypes.bool,
  reset: PropTypes.func,
  room: PropTypes.string.isRequired,
  submitting: PropTypes.bool,
  user: PropTypes.object,
};
