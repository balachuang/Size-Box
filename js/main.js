var objectDB = null;
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
    $(document).on('mouseenter', '.object', showObjectInfo);
    $(document).on('mouseleave', '.object', hideObjectInfo);
    $(document).on('mousemove', '.object:not(".control")', resetTimer);
    $(document).on('mouseleave', '#obj-selector', function(){ $('#obj-selector').hide(); });
    $(document).on('mouseleave', '#cat-selector', hideCategorySelector);

    $('#add-object').click(addObject);
    $('#change-category').click(showCategorSelectory);
    $(document).on('click', 'span.cat-option', checkCategory);
    $(document).on('click', 'span.obj-option', updateObject);
    $(document).on('click', '.object-delete', delObject);
    $(document).on('click', '.object-change', showObjectSelector);
    $(document).on('click', '.object-left', prevImage);
    $(document).on('click', '.object-right', nextImage);
    // $(document).on('change', '.cat-check', prepareObjSelector);

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

    resizeObject(0, 20, maxHeight);
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
            thisObj.animate({left:tarL, top:tarT}, 200);
            var thisImg = thisObj.find('.object-image.active');
            thisImg.animate({height:tarH}, 200, function(){
                if (thisImg.height() < 0.1 * $('#main-container').height())
                {
                    // this object is too small, show mark
                    thisObj.find('.object-mark').css({
                        top: thisImg.position().top - 30,
                        left: thisImg.position().left + (thisImg.width() - thisObj.find('.object-mark').width()) / 2
                    }).show();
                }else{
                    thisObj.find('.object-mark').hide();
                }
                if (thisObj.find('div.object-delete:visible').length > 0) thisObj.mouseenter();
            });
        }
    }

    // recursive go...
    resizeObject(idx + 1, curLeft + curW + 20, maxHeight);
}

// add a new object
function addObject()
{
    // read default object information
    var obj = readObjectInformation();
    var l = $('#add-object').position().left;

    // var imgs = obj.image.split(',');
    var imgs = obj.images.split(';');
    var imghtml = '<img class="object-image active" src="' + $.trim(imgs[0]) + '">';
    for (var n=1; n<imgs.length; ++n) {
        imghtml += '<img class="object-image disable" src="' + $.trim(imgs[n]) + '">';
    }

    // visualize object
    $('#add-object').before(
        '<div class="object" name="' + obj.name + '" obj-height="' + obj.height + '" style="top:0px; left:' + l + '">' + 
        '   <a href="https://www.google.com.tw/?gws_rd=ssl#safe=off&q=' + obj.name + '" target="_new">' + imghtml + '</a>' +
        '   <div class="object-name">' + obj.name + '</div>' +
        // '   <div class="object-description">' + obj.description + '</div>' +
        '   <div class="object-delete"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></div>' +
        '   <div class="object-change"><span class="glyphicon glyphicon-th-large" aria-hidden="true"></span></div>' +
        '   <div class="object-left"><span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span></div>' +
        '   <div class="object-right"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></div>' +
        '   <div class="object-mark"><img src="images/mark.png" style="width:100%;"></div>' +
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
function showObjectSelector()
{
    // set targetObj for call back function
    targetObj = $(this).closest('div.object');

    // display selector
    if ($(this).offset().top + $('#obj-selector').height() >= $('#main-container').height() - 30)
    {
        $('#obj-selector').hide().css({
            top: $(this).offset().top - $('#obj-selector').height(),
            left: $(this).offset().left + 30
        }).show();
    }else{
        $('#obj-selector').hide().css({
            top: $(this).offset().top,
            left: $(this).offset().left + 30
        }).show();
    }
}

function updateObject()
{
    $('#obj-selector').hide();

    // read default object information
    var objid = $(this).attr('objid');
    var obj = readObjectInformation(objid);

    // visualize object
    targetObj.attr('obj-height', obj.height);
    targetObj.find('a').attr('href', 'https://www.google.com.tw/?gws_rd=ssl#safe=off&q=' + obj.name);
    targetObj.find('div.object-name').text(obj.name);
    // targetObj.find('div.object-description').text(obj.description);
    targetObj.find('img.object-image-active').remove();
    targetObj.find('img.object-image').remove();

    var imgs = obj.images.split(';');
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
function readObjectInformation(objid)
{
    var targetObjID = objid;
    if (targetObjID == null) {
        if ($('span.obj-option').length <= 0) return objectDB().first().get()[0];
        targetObjID = $('span.obj-option:eq(0)').attr('objid');
    }
    return objectDB(targetObjID).get()[0];
}

// show object information when mouse over
function showObjectInfo()
{
    var thisMark = $(this).find('.object-mark:visible');
    if (thisMark.length > 0)
    {
        // if the object is too small, there is no need to enable the image change icons
        $(this).find('div.object-delete').css({
            top: thisMark.position().top - 25,
            left: thisMark.position().left - 2
        }).fadeIn(100);
        $(this).find('div.object-change').css({
            top: thisMark.position().top - 50,
            left: thisMark.position().left - 2
        }).fadeIn(100);
    }else{
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
    }

    $('#object-name-lable').text($(this).find('div.object-name').text());

    if (idleTimer != null) clearInterval(idleTimer);
    idleTimer = setInterval(checkIdle, 1000);
}

// show object information when mouse out
function hideObjectInfo()
{
    if ($(this).find('.object-mark:visible').length > 0)
    {
        var o1 = $(this).find('div.object-delete');
        var o2 = $(this).find('div.object-change');
        setTimeout(function(){
            o1.hide();
            o2.hide();
        }, 3000);
    }else{
        $(this).find('div.object-delete').hide();
        $(this).find('div.object-change').hide();
        $(this).find('div.object-name').hide();
        $(this).find('div.object-left').hide();
        $(this).find('div.object-right').hide();
        $('#object-name-lable').hide();
    }

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

function showCategorSelectory()
{
    $('#cat-selector').hide().css({
        top: $('#change-category').offset().top - $('#cat-selector').height(),
        left: $('#change-category').offset().left - $('#change-category').width() - 10
    }).show();
}

function checkCategory()
{
    if ($(this).text().indexOf('全選') >= 0) return $('input.cat-check').prop('checked', true);
    if ($(this).text().indexOf('全不選') >= 0) return $('input.cat-check').prop('checked', false);

    var c = $(this).prev('input').prop('checked');
    $(this).prev('input').prop('checked', !c);
}

function hideCategorySelector()
{
    if ($('input.cat-check:checked').length <= 0) $('input.cat-check:eq(0)').prop('checked', true);
    $('#cat-selector').hide();
    prepareObjSelector();
}

// read all object information from properties file
// call prepareSelector to prepare selector for changeObject
function prepareObjectsAndSelector()
{
    // var userLang = navigator.language || navigator.userLanguage;
    $.get( "objects.csv", parsePropertyFile);
}

function parsePropertyFile(data)
{
    var lines = data.split('\n');
    var colNum = $.trim(lines[0]).split(',').length;

    objectDB = TAFFY();
    var obj = null;

    // line 1 is only for human read
    for (var n=1; n<lines.length; ++n)
    {
        if ($.trim(lines[n]) == '') continue;

        var thisVals = $.trim(lines[n]).split(',');
        if (thisVals.length < colNum) {
            console.error('Wrong column number of this line: ' + lines[n]);
            continue;
        }

        // skip Descipriton, currently useless
        objectDB.insert({
            category: $.trim(thisVals[0]),
            name: $.trim(thisVals[1]),
            height: eval($.trim(thisVals[3])),
            images: $.trim(thisVals[4])
        });
    }

    prepareCatSelector();
    prepareObjSelector();
}

function prepareCatSelector()
{
    $('#cat-selector').remove();

    var catSelector = '<div id="cat-selector">';
    catSelector += '<div><span class="cat-option">[全選]</a></div>';
    catSelector += '<div><span class="cat-option">[全不選]</a></div>';
    $.each(objectDB().distinct('category'), function(k,v){
        catSelector += '<div><input type="checkbox" class="cat-check" value="' + v + '"> <span class="cat-option">' + v + '</span></div>';
    });
    catSelector += '</div>';
    $(catSelector).hide().appendTo('body').find('.cat-check:eq(0)').prop('checked', true);
}

function prepareObjSelector()
{
    // remove current objects
    $('.object:not(".control")').remove();
    $('#obj-selector').remove();

    var catFilterArray = new Array();
    $('input.cat-check:checked').each(function(){ catFilterArray.push($(this).val()); });

    var objSelector = '<div id="obj-selector">';
    objectDB({category:catFilterArray}).order('height').each(function(r, rn){
        objSelector += '<div><span class="obj-option" objid="' + r.___id + '">[' + r.height + 'm] ' + r.name + '</span></div>';
    });
    objSelector += '</div>';
    $(objSelector).hide().appendTo('body');
}

