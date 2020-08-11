import React, { PureComponent } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

export default class InstagramEmbed extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      response: null,
      height: 240,
      width: 320,
      avatar: null,
      likes: 0,
      views: 0,
      comments: 0,
      thumbnail: null,
    };
  }

  _onLayout = layout => {
    this.setState({
      height: layout.nativeEvent.layout.height,
      width: layout.nativeEvent.layout.width,
    });
  };

  /*
   * This is fairly experimental and probably not the best way to supplement
   * existing API (official) data with missing properties we need.
   */
  _fetchComplementaryData = url => {
    let match = url.split('/');
    match = match.filter(item => item !== "");

    const id = match.slice(-1)[0];
  
    if (!id) {
      return;
    } 

    fetch(`https://www.instagram.com/p/${id}/embed/captioned/`)
      .then(response => response.text())
      .then(responseText => {
        let avatarRegex = /class\=\"ehAvatar\"\s+src=\"([a-zA-Z0-9\-\\\:\/\.\_]+)\"/g;
        let avatarMatch = avatarRegex.exec(responseText);
        
        let likesRegex = /span\s+class\=\"espMetricTextCollapsible\"><\/span>([0-9\,\.km]+)<span\s+class\=\"espMetricTextCollapsible\">\s+likes?/g;
        let likesMatch = likesRegex.exec(responseText);

        let viewsRegex = /span\s+class\=\"espMetricTextCollapsible\"><\/span>([0-9\,\.km]+)<span\s+class\=\"espMetricTextCollapsible\">\s+views?/g;
        let viewsMatch = viewsRegex.exec(responseText);

        let commentsRegex = /span\s+class\=\"espMetricTextCollapsible\"><\/span>([0-9\,\.km]+)<span\s+class\=\"espMetricTextCollapsible\">\s+comments?/g;
        let commentsMatch = commentsRegex.exec(responseText);

        let thumbnailRegex = /class\=\"efImage\"\s+src=\"([a-zA-Z0-9\-\\\:\/\.\_]+)\"/g;
        let thumbnailMatch = thumbnailRegex.exec(responseText);

        this.setState({
          thumbnail: thumbnailMatch ? thumbnailMatch[1] : null,
          avatar: avatarMatch ? avatarMatch[1] : null,
          likes: likesMatch ? likesMatch[1] : null,
          views: viewsMatch ? viewsMatch[1] : null,
          comments: commentsMatch ? commentsMatch[1] : null,
        });
      })
      .catch(error => { });
  };

  componentDidMount = () => {
    const { url } = this.props;
    fetch(`https://api.instagram.com/oembed/?url=${url}`)
      .then(response => response.json())
      .then(responseJson => {
        this._fetchComplementaryData(url);
        this.setState({ response: responseJson });
      })
      .catch(error => {
        this.setState({ response: null });
      });
  };

  render() {
    const { style } = this.props;
    const {
      response,
      height,
      width,
      avatar,
      likes,
      comments,
      views,
    } = this.state;

    if (!response) {
      return <View style={[{ width: 0, height: 0 }, style]} />;
    }

    const { thumbnail_url, author_name, thumbnail_height, thumbnail_width } = response;

    return (
      <View
        style={[
          styles.container,
          style,
          {
            height: height,
          },
        ]}
      >
        <View onLayout={this._onLayout}>
          <View style={styles.headerContainer}>
            {avatar && (
              <Image
                source={{
                  uri: avatar,
                }}
                style={styles.avatar}
              />
            )}
            <Text style={styles.author}>{author_name}</Text>
          </View>
          {!!thumbnail_url && (
            <Image
              source={{ uri: thumbnail_url }}
              style={{
                height:
                  thumbnail_height * width / thumbnail_width,
              }}
            />
          )}
          <View style={{ flexDirection: 'column', margin: 8 }}>
            <View style={styles.statsContainer}>
              {!!views && (
                <View style={{ flexDirection: 'row' }}>
                  <Image
                    source={require('./assets/images/icon_views.png')}
                    style={styles.statIcon}
                  />
                  <Text style={styles.statLabel}>{views} views</Text>
                </View>
              )}
              {!!likes && (
                <View style={{ flexDirection: 'row' }}>
                  <Image
                    source={require('./assets/images/icon_likes.png')}
                    style={styles.statIcon}
                  />
                  <Text style={styles.statLabel}>{likes} likes</Text>
                </View>
              )}
              {!!comments && (
                <View style={{ flexDirection: 'row' }}>
                  <Image
                    source={require('./assets/images/icon_comments.png')}
                    style={styles.statIcon}
                  />
                  <Text style={styles.statLabel}>{comments} comments</Text>
                </View>
              )}
            </View>
            <Text>{response.title}</Text>
          </View>
        </View>
      </View>
    );
  }
}
