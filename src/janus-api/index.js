/**
 * Copyright (c) [2015-2020] SUSE Linux
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

/**
 * This module offers an API to interact with a Janus server.
 *
 * @todo Read configuration.
 */
import { createRoomService } from './room-service';
import { createFeedsService } from './feeds-service';
import { createLogService } from './log-service';
import { createEventsService } from './events-service';
import { createDataChannelService } from './data-channel-service';
import { createActionService } from './action-service';

export default (function() {
  var that = {
    dataChannelService: null,
    eventsService: null,
    feedsService: null,
    logService: null,
    roomService: null,
    actionService: null
  };

  that.setup = function(
    { janusServer, janusServerSSL, joinUnmutedLimit, videoThumbnails },
    handler
  ) {
    that.eventsService = createEventsService();
    that.feedsService = createFeedsService(that.eventsService);
    that.logService = createLogService(that.eventsService);
    that.dataChannelService = createDataChannelService(
      that.feedsService,
      that.logService,
      that.eventsService
    );

    that.actionService = createActionService(
      that.feedsService,
      that.logService,
      that.dataChannelService,
      that.eventsService
    );

    that.roomService = createRoomService(
      { janusServer, janusServerSSL, joinUnmutedLimit, videoThumbnails },
      that.feedsService,
      that.logService,
      that.dataChannelService,
      that.eventsService,
      that.actionService
    );

    if (handler) {
      that.getEventsSubject().subscribe(handler);
    }
  };

  that.getRooms = () => that.roomService.getRooms();
  that.enterRoom = (room, username, pin) => {
    that.roomService.setRoom(room);
    return that.roomService.enter(username, pin);
  };
  that.publishScreen = () => that.roomService.publishScreen('screen');
  that.unpublishFeed = (feedId) => that.roomService.unPublishFeed(feedId);
  that.leaveRoom = () => that.roomService.leave();
  that.getEventsSubject = () => that.eventsService.getEventsSubject();
  that.sendMessage = (text) => that.actionService.writeChatMessage(text);
  that.getFeedStream = (feedId) => {
    let feed = that.feedsService.find(feedId);
    return feed !== null ? feed.getStream() : null;
  };
  that.toggleAudio = (feedId) => {
    let feed = that.feedsService.find(feedId);
    if (!feed) return;

    that.roomService.toggleChannel('audio', feed);
  };
  that.toggleVideo = () => {
    that.roomService.toggleChannel('video');
  };
  that.reconnectFeed = (feedId) => that.roomService.reconnectFeed(feedId);
  that.enableThumbnailMode = () => that.actionService.disableVideoSubscriptions();
  that.disableThumbnailMode = () => that.actionService.enableVideoSubscriptions();

  return that;
})();
