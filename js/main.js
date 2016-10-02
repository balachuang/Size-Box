var currCategory = null;
var objectArray = null;
var targetObj = null;
var idleTimer = null;
var idleTime = 0;
var mouseEvent = null;

$(document).ready(initDocument);

function initDocument()
{
    prepareObjectsAndSelector();
    resizeContainers();

    $(window).resize(resizeContainers);
    $(document).on('mouseenter', '.object', displayObjectInfo);
    $(document).on('mouseleave', '.object', hideObjectInfo);
    $(document).on('mousemove', '.object:not(".control")', resetTimer);

    $('#add-object').click(addObject);
    $('#change-category').click(changeCategory);
    $(document).on('click', '.object-delete', delObject);
    $(document).on('click', '.object-change', changeObject);
    $(document).on('click', '.object-left', prevImage);
    $(document).on('click', '.object-right', nextImage);

    $('#object-progress-bar').mousewheel(function(event, delta) {
        this.scrollLeft -= (delta * 30);
        event.preventDefault();
    });
}

// resize all contains and objects
function resizeContainers()
{
    $('#main-container').css({
        'left' : 10,
        'top' : 10,
        'width' : $(document).width() - 20,
        'height' : $(document).height() - 20
    });
    $('#y-axis').css({
        'left' : 0,
        'top' : 0,
        'width' : 50,
        'height' : $('#main-container').height() - 50
    });
    $('#x-axis').css({
        'left' : 0,
        'top' : $('#main-container').height() - 50,
        'height' : 50
    });
    $('#x-axis').width($('#main-container').width());
    $('#object-container').css({
        'left' : 50,
        'top' : 0,
        'height' : $('#main-container').height() - 50
    });
    $('#object-progress-bar').css({
        'left' : 0,
        'top' : 0,
        'height' : $('#main-container').height()
    });
    $('#object-container').width($('#main-container').width() - 50);
    $('#object-progress-bar').width($('#object-container').width());

    resizeObjects();
}

// resizing and relocation all objects.
// recursively call resizeObject to perform animation
function resizeObjects()
{
    var maxHeight = 0;
    for (var n=0; n<$('.object').length; ++n)
    {
        var thisObj = $('.object').eq(n);
        var h = eval(thisObj.attr('obj-height'));
        if (maxHeight < h) maxHeight = h;
    }

    resizeObject(0, 10, maxHeight);
}

function resizeObject(idx, curLeft, maxHeight)
{
    if (idx >= $('.object').length)
    {
        setTimeout(resizeObjects, 500);
        return;
    }

    var thisObj = $('.object').eq(idx);

    var curH = thisObj.height();
    var curW = thisObj.width();
    var curT = thisObj.position().top;
    var curL = thisObj.position().left;

    var actH = eval(thisObj.attr('obj-height'));

    var tarH = thisObj.hasClass('control') ? ($('#add-object').height()) : ($('#object-container').height() * actH / maxHeight);
    var tarT = $('#object-container').height() - tarH;
    var tarL = curLeft;

    if ((curT != tarT) || (curL != tarL) || (curH != tarH))
    {
        if (thisObj.hasClass('control')) {
            thisObj.animate({ 'left' : tarL, 'top' : tarT}, 200);
        }else{
            thisObj.animate({left:tarL, top:tarT, opacity:1.0}, 200);
            thisObj.find('.object-image.active').animate({height:tarH}, 200, function(){
                if (thisObj.find('div.object-delete:visible').length > 0) thisObj.mouseenter();
            });
        }
    }

    // recursive go...
    resizeObject(idx + 1, curLeft + curW + 10, maxHeight);
}

// add a new object
function addObject()
{
    // read default object information
    var obj = readObjectInformation(-1);
    var l = $('#add-object').position().left;

    var imgs = obj.image.split(',');
    var imghtml = '<img class="object-image active" src="' + $.trim(imgs[0]) + '">';
    for (var n=1; n<imgs.length; ++n) {
        imghtml += '<img class="object-image disable" src="' + $.trim(imgs[n]) + '">';
    }

    // visualize object
    $('#add-object').before(
        '<div class="object" name="' + obj.name + '" obj-height="' + obj.height + '" style="opacity:0; top:0px; left:' + l + '">' + 
        '   <a href="https://www.google.com.tw/?gws_rd=ssl#safe=off&q=' + obj.name + '" target="_new">' + imghtml + '</a>' +
        '   <div class="object-name">' + obj.name + '</div>' +
        '   <div class="object-description">' + obj.description + '</div>' +
        '   <div class="object-delete"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></div>' +
        '   <div class="object-change"><span class="glyphicon glyphicon-th-large" aria-hidden="true"></span></div>' +
        '   <div class="object-left"><span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span></div>' +
        '   <div class="object-right"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></div>' +
        '</div>'
    );
}

// delete an object
function delObject()
{
    $(this).closest('div.object').remove();
}

// change the object contain
// call updateObject to re-render object
function changeObject()
{
    targetObj = $(this).closest('div.object');
    $('#obj-selector').hide().css({
        top: $(this).offset().top,
        left: $(this).offset().left + 30
    }).show();
}

function updateObject(idx)
{
    $('#obj-selector').hide();

    // read default object information
    var obj = readObjectInformation(idx);

    // visualize object
    targetObj.attr('obj-height', obj.height);
    targetObj.find('a').attr('href', 'https://www.google.com.tw/?gws_rd=ssl#safe=off&q=' + obj.name);
    targetObj.find('div.object-name').text(obj.name);
    targetObj.find('div.object-description').text(obj.description);
    targetObj.find('img.object-image-active').remove();
    targetObj.find('img.object-image').remove();

    var imgs = obj.image.split(',');
    targetObj.find('a').append('<img class="object-image active" src="' + $.trim(imgs[0]) + '">')
    for (var n=1; n<imgs.length; ++n) {
        targetObj.find('a').append('<img class="object-image disable" src="' + $.trim(imgs[n]) + '">')
    }

    targetObj = null;
}

// change image for multiple-image objects
function prevImage()
{
    changeImage($(this).closest('div.object'), -1);
}
function nextImage()
{
    changeImage($(this).closest('div.object'), 1);
}
function changeImage(thisObj, cv)
{
    var imgCount = thisObj.find('img.object-image').length;
    var currActIdx = thisObj.find('img.object-image.active').index();
    var targActIdx = (currActIdx + cv) % imgCount;
    if (targActIdx < 0) targActIdx += imgCount;
    thisObj.find('img.object-image.active').removeClass('active').addClass('disable');
    thisObj.find('img.object-image').eq(targActIdx).removeClass('disable').addClass('active');
}

// return object information by index
function readObjectInformation(idx)
{
    if (idx >= 0)
    {
        if (objectArray == null) return null;
        return objectArray[idx];
    }else{
        // return the cirst object of current category
        if (currCategory == '[ALL]') return objectArray[0];
        for (var n=0; n<objectArray.length; ++n)
        {
            if (objectArray[n].category == currCategory) return objectArray[n];
        }
    }
    return null;
}

// show object information when mouse over
function displayObjectInfo()
{
    $(this).find('div.object-delete').css({
        top: 10,
        left: $(this).width() - 30
    }).fadeIn(100);
    $(this).find('div.object-change').css({
        top: 10,
        left: 10
    }).fadeIn(100);

    if ($(this).find('.object-image').length > 1)
    {
        var h = ($(this).find('.object-image.active').height() - $(this).find('div.object-left').height()) / 2;
        $(this).find('div.object-left').css({
            top: h,
            left: 10
        }).fadeIn(200);
        $(this).find('div.object-right').css({
            top: h,
            left: $(this).width() - $(this).find('div.object-right').width() - 10
        }).fadeIn(200);
    }

    $('#object-name-lable').text($(this).find('div.object-name').text());

    if (idleTimer != null) clearInterval(idleTimer);
    idleTimer = setInterval(checkIdle, 1000);
}

// show object information when mouse out
function hideObjectInfo()
{
    $(this).find('div.object-delete').hide();
    $(this).find('div.object-change').hide();
    $(this).find('div.object-name').hide();
    $(this).find('div.object-left').hide();
    $(this).find('div.object-right').hide();
    $('#object-name-lable').hide();

    clearInterval(idleTimer);
    idleTimer = null;
}

function checkIdle()
{
    if (++idleTime > 1) {
        $('#object-name-lable').css({
            top: mouseEvent.pageY - $('#object-name-lable').height() - 20,
            left: mouseEvent.pageX - $('#object-name-lable').width() - 20
        }).fadeIn(200);
    }
}

function resetTimer(evn)
{
    mouseEvent = evn;
    idleTime = 0;
    $('#object-name-lable').hide();
}

function changeCategory()
{
    $('#cat-selector').hide().css({
        top: $('#change-category').offset().top - $('#cat-selector').height(),
        left: $('#change-category').offset().left + $('#change-category').width() + 10
    }).show();
}

function updateCategory(catName)
{
    $('#cat-selector').hide();
    currCategory = catName;
    console.log(currCategory);
    prepareObjSelector();
    $('.object:not(".control")').remove();
}

// read all object information from properties file
// call prepareSelector to prepare selector for changeObject
function prepareObjectsAndSelector()
{
    var userLang = navigator.language || navigator.userLanguage;

    // read by current browser language, then read default if fail
    $.get('objects_' + userLang + '.properties', parsePropertyFile).fail(function(){
        $.get( "objects.properties", parsePropertyFile);
    });
}

function parsePropertyFile(data)
{
    var lines = data.split('\n');

    var obj = null;
    objectArray = new Array();
    for (var n=0; n<lines.length; ++n)
    {
        var thisLine = $.trim(lines[n]);
        if (thisLine == '## object start') {
            if (obj != null) objectArray.push(obj);
            obj = {'category': '', 'name': '', 'description': '', 'height': 0, 'image': ''};
        }else if (thisLine != '') {
            if (thisLine.startsWith('#')) continue;
            var kv = thisLine.split('=');
            if (kv.length != 2) continue;
            switch($.trim(kv[0]))
            {
                case 'obj_category':
                    obj.category = $.trim(kv[1]);
                    if (currCategory == null) currCategory = obj.category;
                    break;
                case 'obj_name':
                    obj.name = $.trim(kv[1]);
                    break;
                case 'obj_description':
                    obj.description = $.trim(kv[1]);
                    break;
                case 'obj_height':
                    obj.height = eval($.trim(kv[1]));
                    break;
                case 'obj_image':
                    obj.image = $.trim(kv[1]);
                    break;
            }
        }
    }
    if (obj != null) objectArray.push(obj);
    prepareObjSelector();
    prepareCatSelector();
}

function prepareObjSelector()
{
    $('#obj-selector').remove();

    var objSelector = '<div id="obj-selector">';
    if (currCategory == '[ALL]')
    {
        console.log('1');
        for (var n=0; n<objectArray.length; ++n) {
            var obj = objectArray[n];
            objSelector += '<div><a role="menuitem" tabindex="-1" href="javascript:updateObject('+n+')">' + obj.name + '</a></div>';
        }
    }else{
        console.log('2');
        for (var n=0; n<objectArray.length; ++n) {
            var obj = objectArray[n];
            if (obj.category != currCategory) continue;
            objSelector += '<div><a role="menuitem" tabindex="-1" href="javascript:updateObject('+n+')">' + obj.name + '</a></div>';
        }
    }
    objSelector += '</div>';
    console.log(objSelector);
    $(objSelector).hide().appendTo('body');
}

function prepareCatSelector()
{
    $('#cat-selector').remove();

    var cats = new Array();
    for (var n=0; n<objectArray.length; ++n) {
        var obj = objectArray[n];
        if (cats.indexOf(obj.category) < 0) cats.push(obj.category);
    }
    cats.sort();

    var catSelector = '<div id="cat-selector">';
    for (var n=0; n<cats.length; ++n) {
        catSelector += '<div><a role="menuitem" tabindex="-1" href="javascript:updateCategory(\''+cats[n]+'\')">' + cats[n] + '</a></div>';
    }
    catSelector += '<div><a role="menuitem" tabindex="-1" href="javascript:updateCategory(\'[ALL]\')">不分類</a></div>';
    catSelector += '</div>';
    $(catSelector).hide().appendTo('body');
}

// sodadb: https://sodadb.com/WE3JM43yGOHscOMT5VvZ
// sodadb: https://sodadb.com/api.php?i=WE3JM43yGOHscOMT5VvZ
