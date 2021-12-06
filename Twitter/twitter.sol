pragma solidity >=0.5.0;
pragma experimental ABIEncoderV2;

//1. Send tweet
//2. Send private messages
//3. Follow other people
//4. Get list of tweets
//5. Implement an API
contract Twitter {
    struct Tweet {
        uint256 id;
        address author;
        string content;
        uint256 createdAt;
    }

    struct Message {
        uint256 id;
        string content;
        address from;
        address to;
        uint256 createdAt;
    }
    mapping(uint256 => Tweet) private tweets;
    mapping(address => uint256[]) private tweetsOf;
    mapping(uint256 => Message[]) private conversations;
    mapping(address => address[]) private following;
    mapping(address => mapping(address => bool)) private operators;
    uint256 private nextTweetId;
    uint256 private nextMessageId;

    event TweetSent(
        uint256 id,
        address indexed author,
        string content,
        uint256 createdAt
    );

    event MessageSent(
        uint256 id,
        string content,
        address indexed from,
        address indexed to,
        uint256 createdAt
    );

    function tweet(string calldata _content) external {
        _tweet(msg.sender, _content);
    }

    function tweetFrom(address _from, string calldata _content) external {
        _tweet(_from, _content);
    }

    function sendMessage(string calldata _content, address _to) external {
        _sendMessage(_content, msg.sender, _to);
    }

    function sendMessageFrom(
        string calldata _content,
        address _from,
        address _to
    ) external {
        _sendMessage(_content, _from, _to);
    }

    function follow(address _followed) external {
        following[msg.sender].push(_followed);
    }

    function getLatestTweets(uint256 count)
        external
        view
        returns (Tweet[] memory)
    {
        require(
            count > 0 && count <= nextTweetId,
            "Too few or too many tweets to return"
        );
        Tweet[] memory _tweets = new Tweet[](count);
        for (uint256 i = nextTweetId - count; i < nextTweetId; i++) {
            Tweet storage currTweet = tweets[i];
            _tweets[i] = Tweet(
                currTweet.id,
                currTweet.author,
                currTweet.content,
                currTweet.createdAt
            );
        }
        return _tweets;
    }

    function getTweetsOf(address _user, uint256 count)
        external
        view
        returns (Tweet[] memory)
    {
        uint256[] storage tweetIds = tweetsOf[_user];
        require(
            count > 0 && count <= tweetIds.length,
            "Too few or too many tweets to return"
        );
        Tweet[] memory _tweets = new Tweet[](count);
        for (uint256 i = tweetIds.length - count; i < tweetIds.length; i++) {
            Tweet storage _tweet = tweets[tweetIds[i]];
            _tweets[i] = Tweet(
                _tweet.id,
                _tweet.author,
                _tweet.content,
                _tweet.createdAt
            );
        }
        return _tweets;
    }

    function _tweet(address _from, string memory _content)
        internal
        canOperate(_from)
    {
        tweets[nextTweetId] = Tweet(
            nextTweetId,
            _from,
            _content,
            block.timestamp
        );
        tweetsOf[_from].push(nextTweetId);
        emit TweetSent(nextTweetId, _from, _content, block.timestamp);
        nextTweetId++;
    }

    function _sendMessage(
        string memory _content,
        address _from,
        address _to
    ) internal canOperate(_from) {
        uint256 conversationId = uint256(uint160(address(_from))) +
            uint256(uint160(address(_to)));
        conversations[conversationId].push(
            Message(nextMessageId, _content, _from, _to, block.timestamp)
        );
        emit MessageSent(nextMessageId, _content, _from, _to, block.timestamp);
        nextMessageId++;
    }

    modifier canOperate(address _from) {
        require(
            operators[_from][msg.sender] == true,
            "Operator not authorized"
        );
        _;
    }
}
